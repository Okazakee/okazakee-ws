import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const handleI18n = createMiddleware({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  // This will detect the user's preferred language
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};