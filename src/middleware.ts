import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'it'];

// Pre-compile the locale regex pattern for better performance
const localePattern = new RegExp(`^/(${locales.join('|')})(?:/|$)`);

const handleI18n = createMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path: if path already has locale, handle it immediately
  if (localePattern.test(pathname)) {
    return handleI18n(request);
  }

  // Skip locale redirect for static assets and API routes
  if (
    pathname.includes('.') || // Static files
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') // API routes
  ) {
    return;
  }

  // For paths without locale, check cookie first
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return NextResponse.redirect(
      new URL(`/${savedLocale}${pathname}`, request.url)
    );
  }

  // Last resort: system language
  const userLocale = request.headers.get('accept-language')?.split(',')[0].split('-')[0];
  const locale = userLocale && locales.includes(userLocale) ? userLocale : 'en';

  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

// More specific matcher to reduce unnecessary middleware runs
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - static files (which have file extensions)
     * - _next (Next.js internals)
     * - api (API routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
};