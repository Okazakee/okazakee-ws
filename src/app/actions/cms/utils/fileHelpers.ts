import { createJimp } from '@jimp/core';
import webp from '@jimp/wasm-webp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { encode } from 'blurhash';
import { defaultFormats, defaultPlugins } from 'jimp';
import { createClient } from '@/utils/supabase/server';

// Create Jimp instance with WebP support
// Initialize lazily to handle WASM loading issues
// biome-ignore lint/suspicious/noExplicitAny: Jimp type compatibility issue
let JimpInstance: any = null;

function getJimp() {
  if (!JimpInstance) {
    try {
      JimpInstance = createJimp({
        formats: [...defaultFormats, webp],
        plugins: defaultPlugins,
      });
    } catch (error) {
      console.error('Error initializing Jimp with WebP support:', error);
      // Fallback to Jimp without WebP if WASM fails
      JimpInstance = createJimp({
        formats: defaultFormats,
        plugins: defaultPlugins,
      });
    }
  }
  return JimpInstance;
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
const CMS_POST_WRITER_ROLES = ['admin', 'editor', 'mod'] as const;

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

/**
 * Processes an image: resize to max dimensions, convert to WebP
 * Returns the processed buffer and metadata
 * Uses Jimp (pure JS, works on Vercel serverless)
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

    // Get Jimp instance (with lazy initialization)
    const Jimp = getJimp();

    // Read image with Jimp
    const image = await Jimp.read(inputBuffer);
    const originalWidth = image.width;
    const originalHeight = image.height;

    // Calculate new dimensions
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (maxWidth && maxHeight) {
      // Resize to fit within both dimensions (for avatars - cover mode)
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const widthRatio = maxWidth / originalWidth;
        const heightRatio = maxHeight / originalHeight;
        // Use larger ratio for cover effect, then crop
        const ratio = Math.max(widthRatio, heightRatio);
        newWidth = Math.round(originalWidth * ratio);
        newHeight = Math.round(originalHeight * ratio);
        image.resize({ w: newWidth, h: newHeight });
        // Crop to exact dimensions
        image.crop({
          x: (newWidth - maxWidth) / 2,
          y: (newHeight - maxHeight) / 2,
          w: maxWidth,
          h: maxHeight,
        });
        newWidth = maxWidth;
        newHeight = maxHeight;
      }
    } else if (originalHeight > maxHeight) {
      // Only resize if height exceeds max (maintain aspect ratio)
      const ratio = maxHeight / originalHeight;
      newWidth = Math.round(originalWidth * ratio);
      newHeight = maxHeight;
      image.resize({ w: newWidth, h: newHeight });
    }

    // Convert to WebP buffer with quality setting using WASM encoder
    // Fallback to PNG if WebP encoding fails (WASM loading issues)
    let processedBuffer: Buffer;
    let format: 'webp' | 'png' = 'webp';
    try {
      processedBuffer = await image.getBuffer('image/webp', { quality });
    } catch (webpError) {
      console.warn('WebP encoding failed, falling back to PNG:', webpError);
      // Fallback to PNG if WebP fails
      processedBuffer = await image.getBuffer('image/png');
      format = 'png';
    }

    // Generate blurhash
    const blurhash = await generateBlurhash(image);

    return {
      success: true,
      buffer: processedBuffer,
      width: newWidth,
      height: newHeight,
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
 * Generates a real blurhash from Jimp image
 */
// biome-ignore lint/suspicious/noExplicitAny: Jimp type compatibility issue
async function generateBlurhash(image: any): Promise<string> {
  try {
    // Clone and resize for blurhash (32x32)
    const smallImage = image.clone().resize({ w: 32, h: 32 });
    const width = smallImage.width;
    const height = smallImage.height;

    // Get raw RGBA pixel data
    const pixels = new Uint8ClampedArray(width * height * 4);
    let idx = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = smallImage.getPixelColor(x, y);
        // Jimp stores colors as 32-bit integers (RGBA)
        pixels[idx++] = (color >> 24) & 0xff; // R
        pixels[idx++] = (color >> 16) & 0xff; // G
        pixels[idx++] = (color >> 8) & 0xff; // B
        pixels[idx++] = color & 0xff; // A
      }
    }

    const blurhash = encode(pixels, width, height, 4, 4);
    return blurhash;
  } catch (error) {
    console.error('Failed to generate blurhash:', error);
    return 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
  }
}

/**
 * Generates a blurhash from a raw image Buffer (e.g. a pre-processed WebP).
 * Used server-side when a client-uploaded WebP skips the processImage path.
 */
export async function generateBlurhashFromBuffer(
  buffer: Buffer
): Promise<string> {
  try {
    const Jimp = getJimp();
    const image = await Jimp.read(buffer);
    return generateBlurhash(image);
  } catch {
    return 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
  }
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
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    return filePath || null;
  } catch {
    return null;
  }
}

/**
 * Backs up an old file before replacing it
 */
export async function backupOldFile(
  supabase: SupabaseClient,
  fileUrl: string,
  bucket: string
): Promise<void> {
  try {
    const filePath = getStoragePathFromPublicUrl(fileUrl, bucket);
    if (!filePath) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return;
    }

    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const backupPath = `backup/${Date.now()}_${fileName}`;

    // Copy file to backup location
    const { error } = await supabase.storage
      .from(bucket)
      .copy(filePath, backupPath);

    if (error) {
      console.warn('Failed to backup old file:', error.message);
    }
  } catch (error) {
    console.warn(
      'Error backing up old file:',
      error instanceof Error ? error.message : 'Unknown error'
    );
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
