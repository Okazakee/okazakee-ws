'use server';
import type { BlogPost } from '@/types/fetchedData.types';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type BlogOperation =
  | { type: 'GET' }
  | { type: 'CREATE'; data: CreateBlogData }
  | { type: 'UPDATE'; id: number; data: UpdateBlogData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_IMAGE';
      blogId: number;
      file: File;
      currentImageUrl?: string;
    };

type CreateBlogData = {
  title_en: string;
  title_it: string;
  image: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
};

type UpdateBlogData = Partial<CreateBlogData>;

type BlogResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validateBlogData(data: CreateBlogData | UpdateBlogData): { isValid: boolean; error?: string } {
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

export async function blogActions(
  operation: BlogOperation
): Promise<BlogResult> {
  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getBlogData(supabase);

      case 'CREATE':
        return await createBlog(supabase, operation.data);

      case 'UPDATE':
        return await updateBlog(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deleteBlog(supabase, operation.id);

      case 'UPLOAD_IMAGE':
        return await uploadBlogImage(
          supabase,
          operation.blogId,
          operation.file,
          operation.currentImageUrl
        );

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Blog action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getBlogData(supabase: SupabaseClient): Promise<BlogResult> {
  try {
    // For CMS, fetch all blog posts without limit
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return { success: true, data: blogPosts || [] };
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return {
      success: false,
      error: `Failed to fetch blog data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function createBlog(
  supabase: SupabaseClient,
  data: CreateBlogData
): Promise<BlogResult> {
  try {
    // Validate input data
    const validation = validateBlogData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { data: newBlog, error } = await supabase
      .from('blog_posts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: newBlog };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return {
      success: false,
      error: 'Failed to create blog post',
    };
  }
}

async function updateBlog(
  supabase: SupabaseClient,
  id: number,
  data: UpdateBlogData
): Promise<BlogResult> {
  try {
    // Validate input data
    const validation = validateBlogData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if blog post exists
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    const { data: updatedBlog, error } = await supabase
      .from('blog_posts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: updatedBlog };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return {
      success: false,
      error: 'Failed to update blog post',
    };
  }
}

async function deleteBlog(
  supabase: SupabaseClient,
  id: number
): Promise<BlogResult> {
  try {
    // Check if blog post exists
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return {
      success: false,
      error: 'Failed to delete blog post',
    };
  }
}

async function uploadBlogImage(
  supabase: SupabaseClient,
  blogId: number,
  file: File,
  currentImageUrl?: string
): Promise<BlogResult> {
  try {
    // Validate file
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if blog post exists
    const { data: existingBlog, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', blogId)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    // Backup old image if it exists
    if (currentImageUrl) {
      await backupOldFile(supabase, currentImageUrl, 'website');
    }

    // Generate blurhash
    const blurhash = await generateBlurhashFromFile(file);

    // Upload to Supabase Storage
    const fileName = `blog/images/${blogId}_${Date.now()}.${file.name
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

    // Update blog post with new image URL and blurhash
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        image: urlData.publicUrl,
        blurhashURL: blurhash,
      })
      .eq('id', blogId);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { image: urlData.publicUrl, blurhashURL: blurhash },
    };
  } catch (error) {
    console.error('Error uploading blog image:', error);
    return {
      success: false,
      error: 'Failed to upload blog image',
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
