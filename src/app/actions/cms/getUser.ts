'use server';

import { createClient } from '@/utils/supabase/server';

export type CMSUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'admin' | 'editor' | '';
  authProvider: 'email' | 'github';
  githubUsername: string | null;
};

export async function getUser(): Promise<CMSUser | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Fetch user profile from user_profiles table
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch user role from cms_allowed_users
  let allowedUser: { role: string } | null = null;
  
  // Try by email first
  if (user.email) {
    const { data: emailMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .single();
    if (emailMatch) allowedUser = emailMatch;
  }
  
  // Try by GitHub username if no email match
  const githubUsername = user.user_metadata?.user_name;
  if (!allowedUser && githubUsername) {
    const { data: githubMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('github_username', githubUsername)
      .single();
    if (githubMatch) allowedUser = githubMatch;
  }

  // If no profile exists yet (edge case), create one from auth metadata
  if (!profile) {
    const displayName = user.user_metadata?.full_name 
      || user.user_metadata?.name 
      || user.user_metadata?.user_name 
      || user.email?.split('@')[0] 
      || 'User';

    // Ensure avatarUrl is null if empty string
    const rawAvatarUrl = user.user_metadata?.avatar_url;
    const avatarUrl = rawAvatarUrl && rawAvatarUrl.length > 0 ? rawAvatarUrl : null;
    const authProvider = user.app_metadata?.provider === 'github' ? 'github' : 'email';

    // Try to create the profile (may fail due to RLS, that's ok)
    try {
      await supabase.from('user_profiles').insert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        avatar_url: avatarUrl,
        auth_provider: authProvider,
        github_username: user.user_metadata?.user_name || null,
      });
    } catch {
      // Profile creation failed, likely RLS - continue anyway
    }

    return {
      id: user.id,
      email: user.email || '',
      displayName,
      avatarUrl,
      role: (allowedUser?.role as 'admin' | 'editor') || '',
      authProvider: authProvider as 'email' | 'github',
      githubUsername: user.user_metadata?.user_name || null,
    };
  }

  // Ensure avatarUrl is null if empty
  const profileAvatarUrl = profile.avatar_url && profile.avatar_url.length > 0 
    ? profile.avatar_url 
    : null;

  return {
    id: user.id,
    email: user.email || '',
    displayName: profile.display_name || user.email?.split('@')[0] || 'User',
    avatarUrl: profileAvatarUrl,
    role: (allowedUser?.role as 'admin' | 'editor') || '',
    authProvider: (profile.auth_provider as 'email' | 'github') || 'email',
    githubUsername: profile.github_username || null,
  };
}
