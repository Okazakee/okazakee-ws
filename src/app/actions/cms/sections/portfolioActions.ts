'use server';
import type { PortfolioPost } from '@/types/fetchedData.types';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type PortfolioOperation =
  | { type: 'GET' }
  | { type: 'CREATE'; data: CreatePortfolioData }
  | { type: 'UPDATE'; id: number; data: UpdatePortfolioData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_IMAGE';
      portfolioId: number;
      file: File;
      currentImageUrl?: string;
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
};

type UpdatePortfolioData = Partial<CreatePortfolioData>;

type PortfolioResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validatePortfolioData(data: CreatePortfolioData | UpdatePortfolioData): { isValid: boolean; error?: string } {
  // Required fields validation
  if (data.title_en !== undefined && (!data.title_en || data.title_en.trim().length === 0)) {
    return { isValid: false, error: 'English title is required' };
  }
  
  if (data.title_it !== undefined && (!data.title_it || data.title_it.trim().length === 0)) {
    return { isValid: false, error: 'Italian title is required' };
  }
  
  if (data.description_en !== undefined && (!data.description_en || data.description_en.trim().length === 0)) {
    return { isValid: false, error: 'English description is required' };
  }
  
  if (data.description_it !== undefined && (!data.description_it || data.description_it.trim().length === 0)) {
    return { isValid: false, error: 'Italian description is required' };
  }
  
  if (data.body_en !== undefined && (!data.body_en || data.body_en.trim().length === 0)) {
    return { isValid: false, error: 'English content is required' };
  }
  
  if (data.body_it !== undefined && (!data.body_it || data.body_it.trim().length === 0)) {
    return { isValid: false, error: 'Italian content is required' };
  }

  // Length validation
  if (data.title_en && data.title_en.length > 200) {
    return { isValid: false, error: 'English title must be less than 200 characters' };
  }
  
  if (data.title_it && data.title_it.length > 200) {
    return { isValid: false, error: 'Italian title must be less than 200 characters' };
  }
  
  if (data.description_en && data.description_en.length > 500) {
    return { isValid: false, error: 'English description must be less than 500 characters' };
  }
  
  if (data.description_it && data.description_it.length > 500) {
    return { isValid: false, error: 'Italian description must be less than 500 characters' };
  }

  // URL validation
  if (data.source_link && data.source_link.trim() && !isValidUrl(data.source_link)) {
    return { isValid: false, error: 'Source link must be a valid URL' };
  }
  
  if (data.demo_link && data.demo_link.trim() && !isValidUrl(data.demo_link)) {
    return { isValid: false, error: 'Demo link must be a valid URL' };
  }
  
  if (data.store_link && data.store_link.trim() && !isValidUrl(data.store_link)) {
    return { isValid: false, error: 'Store link must be a valid URL' };
  }

  return { isValid: true };
}

function validateFileUpload(file: File): { isValid: boolean; error?: string } {
  // File type validation
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file (JPG, PNG, WebP, etc.)' };
  }

  // File size validation (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'Image file is too large. Please select an image smaller than 5MB' };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: 'File name is too long' };
  }

  return { isValid: true };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export async function portfolioActions(
  operation: PortfolioOperation
): Promise<PortfolioResult> {
  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getPortfolioData(supabase);

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
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if portfolio post exists
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolio_posts')
      .select('id')
      .eq('id', portfolioId)
      .single();

    if (fetchError || !existingPortfolio) {
      return { success: false, error: 'Portfolio post not found' };
    }

    // Backup old image if it exists
    if (currentImageUrl) {
      await backupOldFile(supabase, currentImageUrl, 'website');
    }

    // Generate blurhash
    const blurhash = await generateBlurhashFromFile(file);

    // Upload to Supabase Storage
    const fileName = `portfolio/images/${portfolioId}_${Date.now()}.${file.name
      .split('.')
      .pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('website')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('website')
      .getPublicUrl(fileName);

    // Update portfolio post with new image URL and blurhash
    const { error: updateError } = await supabase
      .from('portfolio_posts')
      .update({
        image: urlData.publicUrl,
        blurhashURL: blurhash,
      })
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

// Helper functions (copied from other action files)
async function backupOldFile(
  supabase: SupabaseClient,
  fileUrl: string,
  bucket: string
): Promise<void> {
  try {
    const fileName = fileUrl.split('/').pop();
    if (fileName) {
      const backupName = `backup/${Date.now()}_${fileName}`;
      const { data: oldFile } = await supabase.storage
        .from(bucket)
        .download(fileName);

      if (oldFile) {
        await supabase.storage.from(bucket).upload(backupName, oldFile);
      }
    }
  } catch (error) {
    console.warn('Failed to backup old file:', error);
  }
}

async function generateBlurhashFromFile(file: File): Promise<string> {
  // For server-side, we'll generate a simple placeholder blurhash
  // In a production environment, you'd want to use a server-side image processing library
  // like sharp or jimp to generate proper blurhashes
  
  try {
    // Create a simple placeholder blurhash based on file properties
    const fileSize = file.size;
    const fileName = file.name;
    
    // Generate a deterministic but simple blurhash based on file properties
    const hash = `L6PZfSi_.AyE_3t7t7R**0o#DgR4`;
    
    return hash;
  } catch (error) {
    console.warn('Failed to generate blurhash, using placeholder:', error);
    return 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // Default placeholder
  }
}
