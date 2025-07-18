'use server';
import type { PortfolioPost } from '@/types/fetchedData.types';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encode } from 'blurhash';

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
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, img.width, img.height);
      if (imageData) {
        const hash = encode(
          imageData.data,
          imageData.width,
          imageData.height,
          4,
          4
        );
        resolve(hash);
      } else {
        reject(new Error('Failed to get image data'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}
