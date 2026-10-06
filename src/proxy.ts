import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { isValidLocale, routing } from '@/i18n/routing';
import {
  isLegacyCmsRoute,
  stripLegacyCmsSegment,
} from '@/utils/legacyCmsRoute';

// Locale negotiation lives in src/i18n/routing.ts (single authority). The
// proxy keeps the unrelated guards: bot probes, traversal, legacy CMS.

// Precompiled patterns for performance
const LOCALE_PATTERN = new RegExp(`^/(${routing.locales.join('|')})(?:/|$)`);
const STATIC_ASSET_PATTERN = /\.[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/;
const BOT_PROBE_PATTERNS = [
  /^\/(?:wp-admin(?:\/|$)|wp-content(?:\/|$)|wp-includes(?:\/|$)|wp-json(?:\/|$)|wp-login\.php$|xmlrpc\.php$|phpmyadmin(?:\/|$))/i,
  /^\/wp-[a-z0-9-]+\.php(?:$|[/?#])/i,
  /^\/(?:index|install|setup|config|admin|login|backup|shell|test)\.php(?:$|[/?#])/i,
  /^\/(?:vendor\/phpunit|cgi-bin)(?:\/|$)/i,
  /(?:^|\/)\.(?:env|git|docker)(?:$|[/.])/i,
  /^\/(?:sitemap(?:\.[a-z0-9_-]+)?|news_sitemap\.xml)(?:\/|%2f).+/i,
];

// Comprehensive path traversal protection
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./, // ..
  /%2e%2e/i, // URL encoded ..
  /%2f/i, // URL encoded /
  /\0/, // Null bytes
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional security check for control chars
  /[\u0000-\u001f]/, // Control characters
  /[\u007f-\u009f]/, // Extended control characters
];

const handleI18n = createMiddleware(routing);

function extractLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(LOCALE_PATTERN);
  return match?.[1] && isValidLocale(match[1]) ? match[1] : null;
}

function isBotProbePath(pathname: string): boolean {
  return BOT_PROBE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function validatePathname(pathname: string): string {
  if (!pathname || typeof pathname !== 'string') return '/';

  // Comprehensive path traversal protection
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(pathname)) {
      console.warn('Path traversal attempt detected:', pathname);
      return '/';
    }
  }

  // Normalize path - single regex operation
  const normalized =
    pathname.replace(/\/+/g, '/').replace(/^\/+/, '/').replace(/\/+$/, '') ||
    '/';

  // Additional validation: ensure path doesn't exceed reasonable length
  if (normalized.length > 2048) {
    console.warn('Path too long:', normalized.length);
    return '/';
  }

  return normalized;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBotProbePath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Skip processing for static assets, API routes - matches old matcher behavior
  // Exclude: api, _next/*, favicon.ico, assets/*, fonts/*, images/*, and files with extensions
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    STATIC_ASSET_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  try {
    // Legacy CMS cutover redirect: /{locale}/cms* URLs go to the standalone
    // CMS host, with the /cms segment stripped (the CMS now serves root
    // paths: /en/cms -> https://cms.okazakee.dev/en). 307 preserves the
    // query string. Controlled by LEGACY_CMS_REDIRECT_HOST; when unset these
    // routes no longer exist in this repository.
    if (extractLocaleFromPath(pathname) && isLegacyCmsRoute(pathname)) {
      const legacyCmsHost = process.env.LEGACY_CMS_REDIRECT_HOST;
      if (legacyCmsHost) {
        try {
          const target = new URL(legacyCmsHost);
          const url = request.nextUrl.clone();
          url.protocol = target.protocol;
          url.host = target.host;
          url.pathname = validatePathname(stripLegacyCmsSegment(pathname));
          return NextResponse.redirect(url, 307);
        } catch {
          console.error('Invalid LEGACY_CMS_REDIRECT_HOST:', legacyCmsHost);
        }
      }
    }

    return handleI18n(request);
  } catch (error) {
    console.error('Middleware processing failed:', {
      pathname: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.next();
  }
}
