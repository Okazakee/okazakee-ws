import type { SupabaseClient } from '@supabase/supabase-js';
import { encode } from 'blurhash';
import sharp from 'sharp';
import { createClient } from '@/utils/supabase/server';

/**
 * Verifies the user is authenticated before allowing CMS operations
 * Returns the authenticated user or throws an error
 */
export async function requireAuth(): Promise<{ id: string; email: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Check if user is admin
  const { data: allowedUser } = await supabase
    .from('cms_allowed_users')
    .select('role')
    .eq('email', user.email)
    .single();

  if (allowedUser?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  return { id: user.id, email: user.email || '' };
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
  error?: string;
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

    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const originalHeight = metadata.height || 0;
    const originalWidth = metadata.width || 0;

    // Calculate resize options
    let resizeOptions: sharp.ResizeOptions | undefined;
    
    if (maxWidth && maxHeight) {
      // Resize to fit within both dimensions (for avatars)
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        resizeOptions = {
          width: maxWidth,
          height: maxHeight,
          fit: 'cover',
          withoutEnlargement: true,
        };
      }
    } else if (originalHeight > maxHeight) {
      // Only resize if height exceeds max (for post images)
      resizeOptions = {
        height: maxHeight,
        withoutEnlargement: true,
      };
    }

    // Process image: resize if needed, convert to WebP
    const processedImage = sharp(inputBuffer);
    
    if (resizeOptions) {
      processedImage.resize(resizeOptions);
    }

    const processedBuffer = await processedImage
      .webp({ quality })
      .toBuffer();

    // Get final dimensions
    const finalMetadata = await sharp(processedBuffer).metadata();
    const finalWidth = finalMetadata.width || originalWidth;
    const finalHeight = finalMetadata.height || originalHeight;

    // Generate blurhash from a small version of the image
    const blurhash = await generateBlurhash(processedBuffer);

    return {
      success: true,
      buffer: processedBuffer,
      width: finalWidth,
      height: finalHeight,
      blurhash,
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
 * Generates a real blurhash from image buffer
 */
async function generateBlurhash(imageBuffer: Buffer): Promise<string> {
  try {
    // Create a small version for blurhash (32px wide)
    const { data, info } = await sharp(imageBuffer)
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const blurhash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      4
    );

    return blurhash;
  } catch (error) {
    console.error('Failed to generate blurhash:', error);
    // Return a fallback placeholder
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
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Reject SVG explicitly (security risk - can contain scripts)
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return { isValid: false, error: 'SVG files are not allowed for security reasons. Please use JPG, PNG, or WebP.' };
  }

  // File type validation - only allow specific raster formats
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { isValid: false, error: 'Please select a valid image file (JPG, PNG, WebP, GIF, or AVIF)' };
  }

  // File size validation (10MB limit - will be compressed anyway)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'Image file is too large. Please select an image smaller than 10MB' };
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
export function validatePdfFile(file: File): { isValid: boolean; error?: string } {
  // File type validation
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please select a valid PDF file' };
  }

  // File size validation (10MB limit for PDFs)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'PDF file is too large. Please select a file smaller than 10MB' };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'File name is too long' };
  }

  return { isValid: true };
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
    // Extract file path from URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the bucket index and get the file path after it
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    if (bucketIndex === -1) {
      console.warn('Could not extract file path from URL:', fileUrl);
      return;
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    if (!filePath) {
      console.warn('Empty file path extracted from URL:', fileUrl);
      return;
    }

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
    console.warn('Error backing up old file:', error instanceof Error ? error.message : 'Unknown error');
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
