'use client';

import { getGitHubOAuthUrl, login } from '@/app/actions/cms/login';
import { createClient } from '@/utils/supabase/client';
import { CircleUserRound, Github, Loader2 } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  // Clear any existing session when login page loads (client-side to clear localStorage)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signOut();
  }, []);

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const result = await login(email, password);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      // Redirect on client side
      window.location.href = `/${locale}/cms`;
    }
  };

  const handleGitHubLogin = async () => {
    setIsGitHubLoading(true);
    setError(null);

    // Sign out any existing session first (client-side to clear localStorage)
    const supabase = createClient();
    await supabase.auth.signOut();

    const result = await getGitHubOAuthUrl(locale);
    if (result.error) {
      setError(result.error);
      setIsGitHubLoading(false);
    } else if (result.url) {
      window.location.href = result.url;
    }
  };

  return (
    <section className="my-52 flex items-center justify-center">
      <div className="p-8 rounded-xl w-full max-w-md border border-main">
        <CircleUserRound size={100} className="mx-auto mb-6 text-main" />
        
        <h1 className="text-2xl font-bold text-center mb-6 text-darktext dark:text-lighttext">
          CMS Login
        </h1>

        {/* GitHub Login Button */}
        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={isGitHubLoading}
          className="w-full flex items-center justify-center gap-3 text-lg bg-[#24292e] text-white transition-all py-3 rounded-lg hover:bg-[#1b1f23] focus:outline-hidden mb-4 disabled:opacity-50"
        >
          {isGitHubLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Github className="w-5 h-5" />
          )}
          Continue with GitHub
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-lighttext2/30" />
          <span className="text-lighttext2 text-sm">or</span>
          <div className="flex-1 h-px bg-lighttext2/30" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md px-4 py-2 border focus:outline-hidden mb-4 text-darktext dark:text-lighttext dark:bg-darkgray"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md px-4 py-2 border focus:outline-hidden mb-4 text-darktext dark:text-lighttext dark:bg-darkgray"
            disabled={isLoading}
          />
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 text-xl bg-secondary text-lighttext transition-all py-3 rounded-lg hover:bg-main focus:outline-hidden disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </section>
  );
}
