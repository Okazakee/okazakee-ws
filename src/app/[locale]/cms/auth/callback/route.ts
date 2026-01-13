import { verifyGitHubUser } from '@/app/actions/cms/login';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('=== OAuth Callback Hit ===');
  console.log('Full URL:', request.url);
  
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/cms';

  console.log('Code:', code ? 'present' : 'missing');
  console.log('Origin:', origin);

  // Extract locale from the URL path
  const pathname = new URL(request.url).pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log('Exchange error:', error);

    if (!error) {
      // Verify user is in allowlist
      const verification = await verifyGitHubUser();
      console.log('Verification result:', verification);
      
      if (!verification.allowed) {
        // Redirect to login with error
        const errorUrl = new URL(`/${locale}/cms/login`, origin);
        errorUrl.searchParams.set('error', verification.error || 'Access denied');
        return NextResponse.redirect(errorUrl);
      }

      // User is allowed, redirect to CMS
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/${locale}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/${locale}${next}`);
      } else {
        return NextResponse.redirect(`${origin}/${locale}${next}`);
      }
    }
  }

  // Auth code error, redirect to login with error
  const errorUrl = new URL(`/${locale}/cms/login`, origin);
  errorUrl.searchParams.set('error', 'Authentication failed');
  return NextResponse.redirect(errorUrl);
}
