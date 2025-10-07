import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/* PLEASE REFER TO https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app */

// Secure path matching for CMS routes
const CMS_PUBLIC_PATHS = ['/cms/login', '/cms/register'] as const;

function isPublicCMSPath(pathname: string, locale: string): boolean {
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), '');
  return CMS_PUBLIC_PATHS.some(path => normalizedPath === path);
}

function isAuthCMSPath(pathname: string): boolean {
  return pathname.includes('/cms/login') || pathname.includes('/cms/register');
}

export async function updateSession(request: NextRequest, locale: string) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          supabaseResponse = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Secure path checking - only allow exact public paths
  if (!user && !isPublicCMSPath(request.nextUrl.pathname, locale)) {
    return NextResponse.redirect(new URL(`/${locale}/cms/login`, request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthCMSPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(`/${locale}/cms`, request.url));
  }

  return supabaseResponse;
}
