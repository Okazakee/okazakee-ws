import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/cms';

  // Extract locale from the URL path
  const pathname = new URL(request.url).pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : 'en';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const errorUrl = new URL(`/${locale}/cms/login`, origin);
          errorUrl.searchParams.set('error', 'Authentication failed');
          return NextResponse.redirect(errorUrl);
        }

        // Check allowlist by email or GitHub username
        const githubUsername = user.user_metadata?.user_name;
        const email = user.email;

        let isAllowed = false;

        // Check by email
        if (email) {
          const { data: emailData } = await supabase
            .from('cms_allowed_users')
            .select('role')
            .eq('email', email.toLowerCase())
            .single();
          if (emailData) isAllowed = true;
        }

        // Check by GitHub username
        if (!isAllowed && githubUsername) {
          const { data: githubData } = await supabase
            .from('cms_allowed_users')
            .select('role')
            .eq('github_username', githubUsername)
            .single();
          if (githubData) isAllowed = true;
        }

        if (!isAllowed) {
          await supabase.auth.signOut();
          const errorUrl = new URL(`/${locale}/cms/login`, origin);
          errorUrl.searchParams.set('error', 'Access denied. Please contact the administrator.');
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
    } catch (err) {
      console.error('OAuth callback error:', err);
    }
  }

  // Auth code error, redirect to login with error
  const errorUrl = new URL(`/${locale}/cms/login`, origin);
  errorUrl.searchParams.set('error', 'Authentication failed');
  return NextResponse.redirect(errorUrl);
}
