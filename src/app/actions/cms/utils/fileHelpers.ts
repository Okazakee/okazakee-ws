import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { encode as blurkitEncode } from 'blurkit/node';
import sharp from 'sharp';
import { createClient } from '@/utils/supabase/server';
import { FALLBACK_BLURHASH, isValidBlurhash } from '@/utils/blurhashUtils';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CmsActionRole = 'authenticated' | 'admin' | 'post-writer';

export type CmsActionContext = {
  supabase: ServerSupabaseClient;
  user: { id: string; email: string; githubUsername: string | null };
  role: string | null;
};

async function findAllowedUserRole(
  supabase: ServerSupabaseClient,
  email: string | undefined,
  githubUsername: string | null | undefined
): Promise<string | null> {
  if (email) {
    const { data: emailMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('email', email.toLowerCase())
      .single();
    if (emailMatch?.role) return emailMatch.role as string;
  }

  if (githubUsername) {
    const { data: githubMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('github_username', githubUsername)
      .single();
    if (githubMatch?.role) return githubMatch.role as string;
  }

  return null;
}

export async function getCmsActionContext(
  requiredRole: CmsActionRole = 'authenticated'
): Promise<CmsActionContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const githubUsername =
    typeof user.user_metadata?.user_name === 'string'
      ? user.user_metadata.user_name
      : null;
  const role =
    requiredRole === 'authenticated'
      ? null
      : await findAllowedUserRole(supabase, user.email, githubUsername);

  if (requiredRole === 'admin' && role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  if (
    requiredRole === 'post-writer' &&
    !CMS_POST_WRITER_ROLES.includes(
      role as (typeof CMS_POST_WRITER_ROLES)[number]
    )
  ) {
    throw new Error(
      'Unauthorized: You do not have permission to create or edit posts'
    );
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email || '',
      githubUsername,
    },
    role,
  };
}

/**
 * Verifies the user is authenticated before allowing CMS operations
 * Returns the authenticated user or throws an error
 */
export async function requireAuth(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  return { id: user.id, email: user.email || '' };
}

/**
 * Verifies the user is an admin before allowing admin-only CMS operations
 * Returns the authenticated user or throws an error
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Check if user is admin - try by email first, then GitHub username
  let allowedUser: { role: string } | null = null;

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

  if (allowedUser?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return { id: user.id, email: user.email || '' };
}

/** Roles that are allowed to create/update blog and portfolio posts (must match RLS if using JWT role) */
const CMS_POST_WRITER_ROLES = ['admin', 'editor'] as const;

/**
 * Verifies the user is in cms_allowed_users with a role that can create posts.
 * Use this before INSERT on blog_posts/portfolio_posts when RLS expects JWT role (which we don't set).
 */
export async function requireAllowedPostWriter(): Promise<{
  id: string;
  email: string;
  role: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  let allowedUser: { role: string } | null = null;

  if (user.email) {
    const { data: emailMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .single();
    if (emailMatch) allowedUser = emailMatch;
  }

  const githubUsername = user.user_metadata?.user_name;
  if (!allowedUser && githubUsername) {
    const { data: githubMatch } = await supabase
      .from('cms_allowed_users')
      .select('role')
      .eq('github_username', githubUsername)
      .single();
    if (githubMatch) allowedUser = githubMatch;
  }

  if (
    !allowedUser ||
    !CMS_POST_WRITER_ROLES.includes(
      allowedUser.role as (typeof CMS_POST_WRITER_ROLES)[number]
    )
  ) {
    throw new Error(
      'Unauthorized: You do not have permission to create or edit posts'
    );
  }

  return { id: user.id, email: user.email || '', role: allowedUser.role };
}

/**
 * Service-role Supabase client. Use only in server code after validating the request (e.g. requireAllowedPostWriter).
 * Bypasses RLS.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials');
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Result type for auth check - use this in actions
 */
export type AuthResult =
  | { authenticated: true; userId: string }
  | { authenticated: false; error: string };

const DEFAULT_MAX_HEIGHT = 1080;
const DEFAULT_WEBP_QUALITY = 80;

type ProcessImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

type ProcessImageResult = {
  success: boolean;
  buffer?: Buffer;
  width?: number;
  height?: number;
  blurhash?: string;
  format?: 'webp' | 'png'; // Format actually used
  error?: string;
};

type PreparedImageUpload = {
  buffer: Buffer;
  blurhash: string;
  extension: 'webp' | 'png';
  contentType: 'image/webp' | 'image/png';
};

/**
 * Processes an image: resize to max dimensions, convert to WebP
 * Returns the processed buffer and metadata
 */
export async function processImage(
  file: File,
  options?: ProcessImageOptions
): Promise<ProcessImageResult> {
  try {
    const maxWidth = options?.maxWidth;
    const maxHeight = options?.maxHeight || DEFAULT_MAX_HEIGHT;
    const quality = options?.quality || DEFAULT_WEBP_QUALITY;

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let pipeline = sharp(inputBuffer);

    if (maxWidth && maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, { fit: 'cover', position: 'center' });
    } else {
      const metadata = await sharp(inputBuffer).metadata();
      if ((metadata.height || 0) > maxHeight) {
        pipeline = pipeline.resize(undefined, maxHeight, { fit: 'inside', withoutEnlargement: true });
      }
    }

    let processedBuffer: Buffer;
    let format: 'webp' | 'png' = 'webp';
    try {
      processedBuffer = await pipeline.webp({ quality }).toBuffer();
    } catch {
      processedBuffer = await pipeline.png().toBuffer();
      format = 'png';
    }

    const { hash: blurhash } = await blurkitEncode(inputBuffer.buffer as ArrayBuffer, { size: 32 });

    const outMeta = await sharp(processedBuffer).metadata();

    return {
      success: true,
      buffer: processedBuffer,
      width: outMeta.width,
      height: outMeta.height,
      blurhash,
      format,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

/**
 * Generates a blurhash from a raw image Buffer (e.g. a pre-processed WebP).
 */
export async function generateBlurhashFromBuffer(
  buffer: Buffer
): Promise<string> {
  try {
    const { hash } = await blurkitEncode(buffer.buffer as ArrayBuffer, { size: 32 });
    return hash;
  } catch {
    return FALLBACK_BLURHASH;
  }
}

export async function prepareImageUpload(
  file: File,
  blurhashURL?: string,
  options?: ProcessImageOptions
): Promise<{ success: true; image: PreparedImageUpload } | { success: false; error: string }> {
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    return { success: false, error: validation.error || 'Invalid image file' };
  }

  if (file.type === 'image/webp') {
    const buffer = Buffer.from(await file.arrayBuffer());
    const blurhash = isValidBlurhash(blurhashURL)
      ? blurhashURL
      : await generateBlurhashFromBuffer(buffer);

    return {
      success: true,
      image: {
        buffer,
        blurhash,
        extension: 'webp',
        contentType: 'image/webp',
      },
    };
  }

  const processed = await processImage(file, options);
  if (!processed.success || !processed.buffer) {
    return {
      success: false,
      error: processed.error || 'Failed to process image',
    };
  }

  return {
    success: true,
    image: {
      buffer: processed.buffer,
      blurhash: isValidBlurhash(blurhashURL)
        ? blurhashURL
        : processed.blurhash || FALLBACK_BLURHASH,
      extension: processed.format ?? 'webp',
      contentType: processed.format === 'png' ? 'image/png' : 'image/webp',
    },
  };
}

export async function uploadPreparedImage(
  supabase: SupabaseClient,
  bucket: string,
  pathWithoutExtension: string,
  prepared: PreparedImageUpload
): Promise<{ publicUrl: string; path: string }> {
  const path = `${pathWithoutExtension}.${prepared.extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, prepared.buffer, {
      cacheControl: '3600',
      contentType: prepared.contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export async function removePublicFileIfPresent(
  supabase: SupabaseClient,
  fileUrl: string | null | undefined,
  bucket: string
): Promise<void> {
  if (!fileUrl) return;
  const filePath = getStoragePathFromPublicUrl(fileUrl, bucket);
  if (!filePath) return;
  await supabase.storage.from(bucket).remove([filePath]);
}

export async function removePublicFileIfDifferent(
  supabase: SupabaseClient,
  fileUrl: string | null | undefined,
  bucket: string,
  nextPath: string
): Promise<void> {
  if (!fileUrl) return;
  const filePath = getStoragePathFromPublicUrl(fileUrl, bucket);
  if (!filePath || filePath === nextPath) return;
  await supabase.storage.from(bucket).remove([filePath]);
}

/**
 * Sanitizes a string for use in filenames
 * Removes special characters, replaces spaces with hyphens, converts to lowercase
 */
export function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

// Allowed image MIME types (raster formats only - NO SVG for security)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

/**
 * Validates an uploaded file for images
 * Rejects SVGs to prevent XSS/script injection attacks
 * Accepts WebP files (expected to be pre-processed client-side)
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Reject SVG explicitly (security risk - can contain scripts)
  if (
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg')
  ) {
    return {
      isValid: false,
      error:
        'SVG files are not allowed for security reasons. Please use JPG, PNG, or WebP.',
    };
  }

  // Accept WebP files (should be pre-processed client-side)
  if (file.type === 'image/webp') {
    // File size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error:
          'Image file is too large. Please select an image smaller than 10MB',
      };
    }
    // File name validation
    if (file.name.length > 255) {
      return { isValid: false, error: 'File name is too long' };
    }
    return { isValid: true };
  }

  // File type validation - only allow specific raster formats
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPG, PNG, WebP, GIF, or AVIF)',
    };
  }

  // File size validation (10MB limit - will be compressed anyway)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error:
        'Image file is too large. Please select an image smaller than 10MB',
    };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'File name is too long' };
  }

  return { isValid: true };
}

/**
 * Validates an uploaded file for images (including SVG for skills)
 * Allows SVG files which are typically used for icons
 */
export function validateImageFileWithSvg(file: File): {
  isValid: boolean;
  error?: string;
} {
  // File type validation - allow raster formats and SVG
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
  ] as const;

  if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) {
    return {
      isValid: false,
      error:
        'Please select a valid image file (JPG, PNG, WebP, GIF, AVIF, or SVG)',
    };
  }

  // File size validation (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error:
        'Image file is too large. Please select an image smaller than 10MB',
    };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'File name is too long' };
  }

  return { isValid: true };
}

/**
 * Validates an uploaded PDF file
 */
export function validatePdfFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // File type validation
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please select a valid PDF file' };
  }

  // File size validation (10MB limit for PDFs)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'PDF file is too large. Please select a file smaller than 10MB',
    };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'File name is too long' };
  }

  return { isValid: true };
}

/**
 * Extracts the storage path (within the bucket) from a Supabase public object URL.
 * Returns null if the URL is not from the given bucket or path is empty.
 */
export function getStoragePathFromPublicUrl(
  fileUrl: string,
  bucket: string
): string | null {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucket);
    if (bucketIndex === -1) return null;
    const filePath = decodeURIComponent(
      pathParts.slice(bucketIndex + 1).join('/')
    );
    return filePath || null;
  } catch {
    return null;
  }
}

/**
 * Validates a URL string
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || urlString.trim() === '') return true; // Empty is valid (optional field)
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a date string
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !Number.isNaN(date.getTime());
}
