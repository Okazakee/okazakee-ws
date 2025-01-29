import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const locales = ['en', 'it'];
const localePattern = new RegExp(`^/(${locales.join('|')})(?:/|$)`);

const handleI18n = createMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract user locale from headers
  const userLocale = request.headers
    .get('accept-language')
    ?.split(',')[0]
    .split('-')[0];
  const locale = userLocale && locales.includes(userLocale) ? userLocale : 'en';

  // Handle CMS routes and authentication for all locales
  if (pathname.match(/^\/(en|it)\/cms(\/|$)/)) {
    const response = await updateSession(request, locale);
    if (response) return response; // Return the response if redirection happens
  }

  // Skip locale redirect for static assets, API routes, and login page
  if (
    pathname.includes('.') || // Static files
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') // API routes
  ) {
    return NextResponse.next();
  }

  // Fast path: if path already has locale, handle it immediately
  if (localePattern.test(pathname)) {
    return handleI18n(request);
  }

  // For paths without locale, check cookie first
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return NextResponse.redirect(
      new URL(`/${savedLocale}${pathname}`, request.url)
    );
  }

  // Last resort: system language
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
