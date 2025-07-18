'use server';
import type { BlogPost } from '@/types/fetchedData.types';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encode } from 'blurhash';

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

    if (error) throw error;

    return { success: true, data: blogPosts };
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return {
      success: false,
      error: 'Failed to fetch blog data',
    };
  }
}

async function createBlog(
  supabase: SupabaseClient,
  data: CreateBlogData
): Promise<BlogResult> {
  try {
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
