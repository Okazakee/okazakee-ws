import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/* PLEASE REFER TO https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app */

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

  if (
    !user &&
    !request.nextUrl.pathname.startsWith(`/${locale}/cms/login`) &&
    !request.nextUrl.pathname.startsWith(`/${locale}/cms/register`)
  ) {
    return NextResponse.redirect(new URL(`/${locale}/cms/login`, request.url));
  }

  if (
    user &&
    (request.nextUrl.pathname.includes('login') ||
      request.nextUrl.pathname.includes('register'))
  ) {
    return NextResponse.redirect(new URL(`/${locale}/cms`, request.url));
  }

  return supabaseResponse;
}
