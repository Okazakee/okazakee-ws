'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkLoginRateLimit } from '@/libs/rateLimiters';
import { createClient } from '@/utils/supabase/server';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if user is in the allowlist
 */
async function checkAllowlist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email?: string,
  githubUsername?: string
): Promise<{ allowed: boolean; role?: string }> {
  // Check by email first
  if (email) {
    const { data: emailData } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('email', email.toLowerCase())
      .single();

    if (emailData) {
      return { allowed: true, role: emailData.role };
    }
  }

  // If not found by email, check by GitHub username
  if (githubUsername) {
    const { data: githubData } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('github_username', githubUsername)
      .single();

    if (githubData) {
      return { allowed: true, role: githubData.role };
    }
  }

  return { allowed: false };
}

/**
 * Email + Password login
 */
export async function login(email: string, password: string) {
  // Input validation
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address' };
  }

  if (!password || typeof password !== 'string' || password.length < 1) {
    return { error: 'Password is required' };
  }

  // Get client IP for rate limiting
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  // Rate limit by both IP and email
  const rateLimitKey = `login:${clientIp}:${email.toLowerCase()}`;
  const rateLimit = checkLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.lockoutRemaining || 0) / 60);
    return {
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    };
  }

  const supabase = await createClient();

  // Check allowlist BEFORE attempting login
  const allowlistCheck = await checkAllowlist(supabase, email);
  if (!allowlistCheck.allowed) {
    return { error: 'Access denied. Please contact the administrator.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { error: 'Invalid email or password' };
  }

  revalidatePath('/cms');
  return { success: true, redirectTo: '/cms' };
}

/**
 * Get GitHub OAuth URL for login
 */
export async function getGitHubOAuthUrl(locale: string = 'en') {
  const supabase = await createClient();

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${locale}/cms/auth/callback`;
  console.log('=== GitHub OAuth ===');
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
  console.log('Redirect URL:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
    },
  });

  console.log('OAuth URL:', data?.url);
  console.log('OAuth Error:', error);

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

/**
 * Verify GitHub user is in allowlist (called after OAuth callback)
 */
export async function verifyGitHubUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { allowed: false, error: 'Authentication failed' };
  }

  // Get GitHub username from user metadata
  const githubUsername = user.user_metadata?.user_name;
  const email = user.email;

  // Check allowlist by GitHub username OR email
  const allowlistCheck = await checkAllowlist(supabase, email, githubUsername);

  if (!allowlistCheck.allowed) {
    // Sign out the user since they're not allowed
    await supabase.auth.signOut();
    return {
      allowed: false,
      error: 'Access denied. Please contact the administrator.',
    };
  }

  return { allowed: true, role: allowlistCheck.role };
}
