import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Constants and precompiled patterns for performance
const locales = ['en', 'it'];
const localeSet = new Set(locales);
const defaultLocale = 'en';
const localePattern = new RegExp(`^/(${locales.join('|')})(?:/|$)`);
const cmsPattern = new RegExp(`^/(${locales.join('|')})/cms(/.*)?$`);
const staticAssetPattern = /\.[a-zA-Z0-9]+$/;

const handleI18n = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
});

function getPreferredLocale(request: NextRequest): string {
  try {
    // First check cookie
    const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (savedLocale && localeSet.has(savedLocale)) {
      return savedLocale;
    }

    // Then check Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      const userLocale = acceptLanguage.split(',')[0].split('-')[0];
      if (localeSet.has(userLocale)) {
        return userLocale;
      }
    }
  } catch (error) {
    console.error('Error determining locale:', error);
  }

  return defaultLocale;
}

export default async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Skip processing for static assets, API routes - fastest path
    if (
      staticAssetPattern.test(pathname) || // Static files
      pathname.startsWith('/_next/') || // Next.js internals
      pathname.startsWith('/api/') // API routes
    ) {
      return NextResponse.next();
    }

    // Check if path already has locale
    const hasLocale = localePattern.test(pathname);

    // Handle CMS routes authentication for all locales
    if (hasLocale && cmsPattern.test(pathname)) {
      // Extract the current locale more efficiently
      const currentLocale = pathname.substring(1, 3);

      // Handle auth with locale-aware redirects
      const response = await updateSession(request, currentLocale);
      if (response) return response;
    }

    // If path already has locale, handle i18n
    if (hasLocale) {
      return handleI18n(request);
    }

    // Redirect to localized path
    const locale = getPreferredLocale(request);
    const url = new URL(request.url);
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Middleware error:', error);
    // Fail gracefully - proceed without redirection
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match everything except static files, API routes, and Next.js internals
    '/((?!api|_next/static|_next/image|_next/font|favicon.ico|assets|fonts|images|.*\\.).*)',
  ],
};
