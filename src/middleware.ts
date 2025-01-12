import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'it'];

// Handles routes with locales
const handleI18n = createMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname starts with a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return handleI18n(request);
  }

  // Handle paths without locale
  // Get user's preferred language from headers
  const userLocale = request.headers.get('accept-language')?.split(',')[0].split('-')[0];

  // Set locale based on user preference, defaulting to 'en'
  const locale = userLocale && locales.includes(userLocale) ? userLocale : 'en';

  // Create new URL with locale
  const newUrl = new URL(`/${locale}${pathname}`, request.url);

  // Preserve query parameters
  newUrl.search = request.nextUrl.search;

  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: [
    // Matches all pathnames except those starting with:
    '/((?!api|_next|_vercel|.*\\.).*)' 
  ]
};