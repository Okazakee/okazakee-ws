'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  backupOldFile,
  isValidUrl,
  processImage,
  requireAuth,
  sanitizeFilename,
  validateImageFile,
} from '@/app/actions/cms/utils/fileHelpers';
import { createClient } from '@/utils/supabase/server';

type PortfolioOperation =
  | { type: 'GET' }
  | { type: 'GET_AUTHORS' }
  | { type: 'CREATE'; data: CreatePortfolioData }
  | { type: 'UPDATE'; id: number; data: UpdatePortfolioData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_IMAGE';
      portfolioId: number;
      file: File;
      currentImageUrl?: string;
    };

export type Author = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type CreatePortfolioData = {
  title_en: string;
  title_it: string;
  image: string;
  source_link: string;
  demo_link: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
  store_link: string;
  created_at?: string;
  author_id: string;
};

type UpdatePortfolioData = Partial<CreatePortfolioData>;

type PortfolioResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validatePortfolioData(
  data: CreatePortfolioData | UpdatePortfolioData
): { isValid: boolean; error?: string } {
  // Required fields validation
  if (
    data.title_en !== undefined &&
    (!data.title_en || data.title_en.trim().length === 0)
  ) {
    return { isValid: false, error: 'English title is required' };
  }

  if (
    data.title_it !== undefined &&
    (!data.title_it || data.title_it.trim().length === 0)
  ) {
    return { isValid: false, error: 'Italian title is required' };
  }

  if (
    data.description_en !== undefined &&
    (!data.description_en || data.description_en.trim().length === 0)
  ) {
    return { isValid: false, error: 'English description is required' };
  }

  if (
    data.description_it !== undefined &&
    (!data.description_it || data.description_it.trim().length === 0)
  ) {
    return { isValid: false, error: 'Italian description is required' };
  }

  if (
    data.body_en !== undefined &&
    (!data.body_en || data.body_en.trim().length === 0)
  ) {
    return { isValid: false, error: 'English content is required' };
  }

  if (
    data.body_it !== undefined &&
    (!data.body_it || data.body_it.trim().length === 0)
  ) {
    return { isValid: false, error: 'Italian content is required' };
  }

  // Length validation
  if (data.title_en && data.title_en.length > 200) {
    return {
      isValid: false,
      error: 'English title must be less than 200 characters',
    };
  }

  if (data.title_it && data.title_it.length > 200) {
    return {
      isValid: false,
      error: 'Italian title must be less than 200 characters',
    };
  }

  if (data.description_en && data.description_en.length > 500) {
    return {
      isValid: false,
      error: 'English description must be less than 500 characters',
    };
  }

  if (data.description_it && data.description_it.length > 500) {
    return {
      isValid: false,
      error: 'Italian description must be less than 500 characters',
    };
  }

  // URL validation
  if (data.source_link?.trim() && !isValidUrl(data.source_link)) {
    return { isValid: false, error: 'Source link must be a valid URL' };
  }

  if (data.demo_link?.trim() && !isValidUrl(data.demo_link)) {
    return { isValid: false, error: 'Demo link must be a valid URL' };
  }

  if (data.store_link?.trim() && !isValidUrl(data.store_link)) {
    return { isValid: false, error: 'Store link must be a valid URL' };
  }

  return { isValid: true };
}

export async function portfolioActions(
  operation: PortfolioOperation
): Promise<PortfolioResult> {
  // Auth check - reject unauthenticated requests
  try {
    await requireAuth();
  } catch {
    return { success: false, error: 'Unauthorized: Authentication required' };
  }

  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getPortfolioData(supabase);

      case 'GET_AUTHORS':
        return await getAuthors(supabase);

      case 'CREATE':
        return await createPortfolio(supabase, operation.data);

      case 'UPDATE':
        return await updatePortfolio(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deletePortfolio(supabase, operation.id);

      case 'UPLOAD_IMAGE':
        return await uploadPortfolioImage(
          supabase,
          operation.portfolioId,
          operation.file,
          operation.currentImageUrl
        );

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Portfolio action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getPortfolioData(
  supabase: SupabaseClient
): Promise<PortfolioResult> {
  try {
    // For CMS, fetch all portfolio posts without limit
    const { data: portfolioPosts, error } = await supabase
      .from('portfolio_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: portfolioPosts };
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return {
      success: false,
      error: 'Failed to fetch portfolio data',
    };
  }
}

async function getAuthors(supabase: SupabaseClient): Promise<PortfolioResult> {
  try {
    // Fetch all users who have profiles (have logged in at least once)
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return { success: true, data: profiles || [] };
  } catch (error) {
    console.error('Error fetching authors:', error);
    return {
      success: false,
      error: `Failed to fetch authors: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function createPortfolio(
  supabase: SupabaseClient,
  data: CreatePortfolioData
): Promise<PortfolioResult> {
  try {
    // Validate input data
    const validation = validatePortfolioData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { data: newPortfolio, error } = await supabase
      .from('portfolio_posts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: newPortfolio };
  } catch (error) {
    console.error('Error creating portfolio post:', error);
    return {
      success: false,
      error: 'Failed to create portfolio post',
    };
  }
}

async function updatePortfolio(
  supabase: SupabaseClient,
  id: number,
  data: UpdatePortfolioData
): Promise<PortfolioResult> {
  try {
    // Validate input data
    const validation = validatePortfolioData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if portfolio post exists
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolio_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPortfolio) {
      return { success: false, error: 'Portfolio post not found' };
    }

    const { data: updatedPortfolio, error } = await supabase
      .from('portfolio_posts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: updatedPortfolio };
  } catch (error) {
    console.error('Error updating portfolio post:', error);
    return {
      success: false,
      error: 'Failed to update portfolio post',
    };
  }
}

async function deletePortfolio(
  supabase: SupabaseClient,
  id: number
): Promise<PortfolioResult> {
  try {
    // Check if portfolio post exists
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolio_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPortfolio) {
      return { success: false, error: 'Portfolio post not found' };
    }

    const { error } = await supabase
      .from('portfolio_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting portfolio post:', error);
    return {
      success: false,
      error: 'Failed to delete portfolio post',
    };
  }
}

async function uploadPortfolioImage(
  supabase: SupabaseClient,
  portfolioId: number,
  file: File,
  currentImageUrl?: string
): Promise<PortfolioResult> {
  try {
    // Validate file
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if portfolio post exists and get title for filename
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolio_posts')
      .select('id, title_en')
      .eq('id', portfolioId)
      .single();

    if (fetchError || !existingPortfolio) {
      return { success: false, error: 'Portfolio post not found' };
    }

    // Backup old image if it exists
    if (currentImageUrl) {
      await backupOldFile(supabase, currentImageUrl, 'website');
    }

    // Check if file is already WebP (pre-processed client-side)
    const isWebP = file.type === 'image/webp';
    let buffer: Buffer;
    let blurhash: string | undefined;

    if (isWebP) {
      // File is already WebP - upload directly
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      blurhash = undefined;
    } else {
      // Fallback: process image server-side (should be rare)
      const processed = await processImage(file);
      if (!processed.success || !processed.buffer) {
        return {
          success: false,
          error: processed.error || 'Failed to process image',
        };
      }
      buffer = processed.buffer;
      blurhash = processed.blurhash;
    }

    // Generate filename: {postId}-{title_en}.webp
    const sanitizedTitle = sanitizeFilename(
      existingPortfolio.title_en || 'untitled'
    );
    const fileName = `portfolio/images/${portfolioId}-${sanitizedTitle}.webp`;

    // Delete old file with same name if exists
    await supabase.storage.from('website').remove([fileName]);

    // Upload processed image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('website')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('website')
      .getPublicUrl(fileName);

    // Update portfolio post with new image URL and blurhash (if available)
    const updateData: { image: string; blurhashURL?: string | null } = {
      image: urlData.publicUrl,
    };
    if (blurhash !== undefined) {
      updateData.blurhashURL = blurhash || null;
    }

    const { error: updateError } = await supabase
      .from('portfolio_posts')
      .update(updateData)
      .eq('id', portfolioId);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { image: urlData.publicUrl, blurhashURL: blurhash },
    };
  } catch (error) {
    console.error('Error uploading portfolio image:', error);
    return {
      success: false,
      error: 'Failed to upload portfolio image',
    };
  }
}
