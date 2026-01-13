'use server';

import { processImage, requireAuth, validateImageFile } from '@/app/actions/cms/utils/fileHelpers';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

type UserOperation =
  | { type: 'GET' }
  | { type: 'ADD_EMAIL'; email: string; role?: 'admin' | 'editor' }
  | { type: 'ADD_GITHUB'; github_username: string; role?: 'admin' | 'editor' }
  | { type: 'UPDATE_ROLE'; id: number; role: 'admin' | 'editor' }
  | { type: 'REMOVE'; id: number }
  | { type: 'UPDATE_PROFILE'; profileId: string; displayName?: string };

type AllowedUser = {
  id: number;
  email: string | null;
  github_username: string | null;
  role: 'admin' | 'editor';
  invited_at: string | null;
  created_at: string;
  // Profile data (if user has logged in)
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type UsersResult = {
  success: boolean;
  data?: AllowedUser | AllowedUser[];
  error?: string;
};

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GitHub username validation (alphanumeric and hyphens, 1-39 chars)
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/**
 * Check if current user is an admin
 */
async function isAdmin(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const { data } = await supabase
    .from('cms_allowed_users')
    .select('role')
    .eq('email', user.email)
    .single();

  return data?.role === 'admin';
}

/**
 * Create admin client for user invitations
 */
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function usersActions(operation: UserOperation): Promise<UsersResult> {
  // Auth check
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Unauthorized: Authentication required' };
  }

  const supabase = await createClient();

  // Admin check for non-GET operations
  if (operation.type !== 'GET') {
    const admin = await isAdmin(supabase);
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
  }

  try {
    switch (operation.type) {
      case 'GET':
        return await getAllowedUsers(supabase);

      case 'ADD_EMAIL':
        return await addEmailUser(supabase, operation.email, operation.role);

      case 'ADD_GITHUB':
        return await addGitHubUser(supabase, operation.github_username, operation.role);

      case 'UPDATE_ROLE':
        return await updateUserRole(supabase, operation.id, operation.role);

      case 'REMOVE':
        return await removeUser(supabase, operation.id);

      case 'UPDATE_PROFILE':
        return await updateUserProfile(supabase, operation.profileId, operation.displayName);

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Users action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getAllowedUsers(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
): Promise<UsersResult> {
  const { data, error } = await supabase
    .from('cms_allowed_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch all user profiles to match with allowed users
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, email, display_name, avatar_url, github_username');

  // Match profiles with allowed users
  const usersWithProfiles = (data as AllowedUser[]).map((allowedUser) => {
    const profile = profiles?.find(
      (p) => 
        (allowedUser.email && p.email === allowedUser.email) ||
        (allowedUser.github_username && p.github_username === allowedUser.github_username)
    );
    return {
      ...allowedUser,
      profile: profile ? {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      } : null,
    };
  });

  return { success: true, data: usersWithProfiles };
}

async function addEmailUser(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  email: string,
  role: 'admin' | 'editor' = 'editor'
): Promise<UsersResult> {
  // Validate email
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if already exists
  const { data: existing } = await supabase
    .from('cms_allowed_users')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (existing) {
    return { success: false, error: 'This email is already in the allowed list' };
  }

  // Add to allowlist
  const { data: newUser, error: insertError } = await supabase
    .from('cms_allowed_users')
    .insert({ email: normalizedEmail, role })
    .select()
    .single();

  if (insertError) throw insertError;

  // Create user and send password reset email using admin client
  try {
    const adminClient = getAdminClient();
    
    // Create the user with a random password (they'll reset it)
    const tempPassword = crypto.randomUUID();
    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
    });

    if (createError) {
      console.error('Failed to create user:', createError.message, createError);
      return { 
        success: true, 
        data: newUser as AllowedUser,
        error: `User added to allowlist but account creation failed: ${createError.message}`
      };
    }

    // Send password reset email so they can set their own password
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { error: resetError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${siteUrl}/cms`,
      },
    });

    // Also trigger the actual email
    const { error: emailError } = await adminClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/cms`,
    });

    if (emailError) {
      console.error('Failed to send reset email:', emailError.message);
    } else {
      console.log('User created and reset email sent to:', normalizedEmail);
      // Update invited_at timestamp
      await supabase
        .from('cms_allowed_users')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', newUser.id);
    }
  } catch (inviteErr) {
    console.error('Invite error:', inviteErr);
    return { 
      success: true, 
      data: newUser as AllowedUser,
      error: `User added to allowlist but invite failed.`
    };
  }

  return { success: true, data: newUser as AllowedUser };
}

async function addGitHubUser(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  github_username: string,
  role: 'admin' | 'editor' = 'editor'
): Promise<UsersResult> {
  // Validate GitHub username
  const cleanUsername = github_username.trim().replace(/^@/, '');
  
  if (!cleanUsername || !GITHUB_USERNAME_REGEX.test(cleanUsername)) {
    return { success: false, error: 'Please enter a valid GitHub username' };
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from('cms_allowed_users')
    .select('id')
    .eq('github_username', cleanUsername)
    .single();

  if (existing) {
    return { success: false, error: 'This GitHub username is already in the allowed list' };
  }

  // Add to allowlist (no invite needed - they'll use GitHub OAuth)
  const { data: newUser, error: insertError } = await supabase
    .from('cms_allowed_users')
    .insert({ github_username: cleanUsername, role })
    .select()
    .single();

  if (insertError) throw insertError;

  return { success: true, data: newUser as AllowedUser };
}

async function updateUserRole(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  id: number,
  role: 'admin' | 'editor'
): Promise<UsersResult> {
  // Prevent removing the last admin
  if (role === 'editor') {
    const { data: admins } = await supabase
      .from('cms_allowed_users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length === 1 && admins[0].id === id) {
      return { success: false, error: 'Cannot demote the last admin' };
    }
  }

  const { data, error } = await supabase
    .from('cms_allowed_users')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return { success: true, data: data as AllowedUser };
}

async function removeUser(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  id: number
): Promise<UsersResult> {
  // Prevent removing the last admin
  const { data: user } = await supabase
    .from('cms_allowed_users')
    .select('role')
    .eq('id', id)
    .single();

  if (user?.role === 'admin') {
    const { data: admins } = await supabase
      .from('cms_allowed_users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length === 1) {
      return { success: false, error: 'Cannot remove the last admin' };
    }
  }

  const { error } = await supabase
    .from('cms_allowed_users')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return { success: true };
}

async function updateUserProfile(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  profileId: string,
  displayName?: string
): Promise<UsersResult> {
  const updates: { display_name?: string } = {};

  if (displayName && displayName.trim().length > 0) {
    updates.display_name = displayName.trim();
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No changes to save' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', profileId);

  if (error) throw error;

  return { success: true };
}

/**
 * Upload avatar for a specific user (admin only)
 */
export async function uploadUserAvatar(formData: FormData): Promise<ProfileUpdateResult> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Unauthorized: Authentication required' };
  }

  const supabase = await createClient();

  // Check if admin
  const admin = await isAdmin(supabase);
  if (!admin) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const profileId = formData.get('profileId') as string;
  const avatarFile = formData.get('avatar') as File | null;

  if (!profileId) {
    return { success: false, error: 'Profile ID is required' };
  }

  if (!avatarFile || avatarFile.size === 0) {
    return { success: false, error: 'Please select an image' };
  }

  // Validate the image
  const validation = validateImageFile(avatarFile);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // Process the image (resize, convert to webp)
  const processed = await processImage(avatarFile, {
    maxWidth: 256,
    maxHeight: 256,
    quality: 85,
  });

  if (!processed.success || !processed.buffer) {
    return { success: false, error: processed.error || 'Failed to process image' };
  }

  // Use admin client for storage uploads (bypasses RLS)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Upload to Supabase Storage
  const filePath = `Website Assets/avatars/${profileId}-avatar.webp`;
  const { error: uploadError } = await adminClient.storage
    .from('website')
    .upload(filePath, processed.buffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    return { success: false, error: 'Failed to upload avatar' };
  }

  // Get public URL
  const { data: urlData } = adminClient.storage
    .from('website')
    .getPublicUrl(filePath);

  // Add cache-busting param
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Update user_profiles table
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', profileId);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true, avatarUrl };
}

/**
 * Update a user's display name (admin only)
 */
export async function updateUserDisplayName(profileId: string, displayName: string): Promise<ProfileUpdateResult> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Unauthorized: Authentication required' };
  }

  const supabase = await createClient();

  // Check if admin
  const admin = await isAdmin(supabase);
  if (!admin) {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  if (!profileId) {
    return { success: false, error: 'Profile ID is required' };
  }

  if (!displayName || displayName.trim().length === 0) {
    return { success: false, error: 'Display name is required' };
  }

  // Update user_profiles table
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', profileId);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return { success: false, error: 'Failed to update display name' };
  }

  return { success: true };
}

/**
 * Update current user's profile (display name and/or avatar)
 */
type ProfileUpdateResult = {
  success: boolean;
  avatarUrl?: string;
  error?: string;
};

export async function updateMyProfile(formData: FormData): Promise<ProfileUpdateResult> {
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Unauthorized: Authentication required' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const displayName = formData.get('displayName') as string | null;
  const avatarFile = formData.get('avatar') as File | null;

  const updates: { display_name?: string; avatar_url?: string } = {};

  // Update display name if provided
  if (displayName && displayName.trim().length > 0) {
    updates.display_name = displayName.trim();
  }

  // Handle avatar upload if provided
  if (avatarFile && avatarFile.size > 0) {
    // Validate the image
    const validation = validateImageFile(avatarFile);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Process the image (resize, convert to webp)
    const processed = await processImage(avatarFile, {
      maxWidth: 256,
      maxHeight: 256,
      quality: 85,
    });

    if (!processed.success || !processed.buffer) {
      return { success: false, error: processed.error || 'Failed to process image' };
    }

    // Use admin client for storage uploads (bypasses RLS)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upload to Supabase Storage
    const filePath = `Website Assets/avatars/${user.id}-avatar.webp`;
    const { error: uploadError } = await adminClient.storage
      .from('website')
      .upload(filePath, processed.buffer, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { success: false, error: 'Failed to upload avatar' };
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('website')
      .getPublicUrl(filePath);

    // Add cache-busting param to force refresh
    updates.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
  }

  // If nothing to update
  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'No changes to save' };
  }

  // Update user_profiles table
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return { success: false, error: 'Failed to update profile' };
  }

  return { success: true, avatarUrl: updates.avatar_url };
}
