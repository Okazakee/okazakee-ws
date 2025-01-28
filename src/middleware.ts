import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware'

const locales = ['en', 'it'];

// Pre-compile the locale regex pattern for better performance
const localePattern = new RegExp(`^/(${locales.join('|')})(?:/|$)`);

const handleI18n = createMiddleware({
  locales,
  defaultLocale: 'en',
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Extract user locale from headers
  const userLocale = request.headers.get('accept-language')?.split(',')[0].split('-')[0];
  const locale = userLocale && locales.includes(userLocale) ? userLocale : 'en';

  // Check for CMS routes and handle authentication
  if (pathname.startsWith(`/${locale}/cms`)) {
    const response = await updateSession(request, locale);
    if (response) return response
  }

  // Skip locale redirect for static assets, API routes, and login page
  if (
    pathname.includes('.') || // Static files
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') || // API routes
    pathname.startsWith(`/${locale}/cms/login`) // Login page
  ) {
    return response;
  }

  // Fast path: if path already has locale, handle it immediately
  if (localePattern.test(pathname)) {
    return handleI18n(request);
  }

  // For paths without locale, check cookie first
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return NextResponse.redirect(new URL(`/${savedLocale}${pathname}`, request.url));
  }

  // Last resort: system language
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};