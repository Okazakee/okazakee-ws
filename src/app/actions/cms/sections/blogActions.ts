'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  backupOldFile,
  generateBlurhashFromBuffer,
  getAdminClient,
  getStoragePathFromPublicUrl,
  processImage,
  requireAllowedPostWriter,
  requireAuth,
  sanitizeFilename,
  validateImageFile,
} from '@/app/actions/cms/utils/fileHelpers';
import { createClient } from '@/utils/supabase/server';

type BlogOperation =
  | { type: 'GET' }
  | { type: 'GET_AUTHORS' }
  | { type: 'CREATE'; data: CreateBlogData }
  | { type: 'UPDATE'; id: number; data: UpdateBlogData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_IMAGE_FOR_NEW_POST';
      file: File;
      titleEn: string;
    }
  | { type: 'ROLLBACK_CREATE'; postId: number; imagePath: string }
  | {
      type: 'UPLOAD_IMAGE';
      blogId: number;
      file: File;
      currentImageUrl?: string;
    };

export type Author = {
  id: string;
  display_name: string;
  avatar_url: string | null;
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
  created_at?: string;
  author_id: string;
};

type UpdateBlogData = Partial<CreateBlogData>;

type BlogResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validateBlogData(data: CreateBlogData | UpdateBlogData): {
  isValid: boolean;
  error?: string;
} {
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

  return { isValid: true };
}

export async function blogActions(
  operation: BlogOperation
): Promise<BlogResult> {
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
        return await getBlogData(supabase);

      case 'GET_AUTHORS':
        return await getAuthors(supabase);

      case 'CREATE':
        return await createBlog(supabase, operation.data);

      case 'UPDATE':
        return await updateBlog(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deleteBlog(supabase, operation.id);

      case 'UPLOAD_IMAGE_FOR_NEW_POST':
        return await uploadBlogImageForNewPost(
          operation.file,
          operation.titleEn
        );

      case 'ROLLBACK_CREATE':
        return await rollbackBlogCreate(operation.postId, operation.imagePath);

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

async function getAuthors(supabase: SupabaseClient): Promise<BlogResult> {
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

async function createBlog(
  _supabase: SupabaseClient,
  data: CreateBlogData
): Promise<BlogResult> {
  try {
    const validation = validateBlogData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { id: userId } = await requireAllowedPostWriter();
    const insertData = {
      ...data,
      blurhashURL: data.blurhashURL ?? '',
      author_id: userId,
    };

    const admin = getAdminClient();
    const { data: newBlog, error } = await admin
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: newBlog };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create blog post',
    };
  }
}

async function updateBlog(
  _supabase: SupabaseClient,
  id: number,
  data: UpdateBlogData
): Promise<BlogResult> {
  try {
    await requireAllowedPostWriter();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const validation = validateBlogData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const admin = getAdminClient();
    const { data: existingBlog, error: fetchError } = await admin
      .from('blog_posts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    const { data: updatedBlog, error } = await admin
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
  _supabase: SupabaseClient,
  id: number
): Promise<BlogResult> {
  try {
    await requireAllowedPostWriter();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const admin = getAdminClient();
    const { data: existingBlog, error: fetchError } = await admin
      .from('blog_posts')
      .select('id, image')
      .eq('id', id)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    if (existingBlog.image) {
      const imagePath = getStoragePathFromPublicUrl(
        existingBlog.image as string,
        'website'
      );
      if (imagePath) {
        await admin.storage.from('website').remove([imagePath]);
      }
    }

    const { error } = await admin.from('blog_posts').delete().eq('id', id);

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

/** Upload image with a deterministic path (timestamp + title slug). Returns URL and blurhash for use in INSERT. */
async function uploadBlogImageForNewPost(
  file: File,
  titleEn: string
): Promise<BlogResult> {
  try {
    await requireAllowedPostWriter();
  } catch {
    return {
      success: false,
      error: 'Unauthorized: You do not have permission to upload images',
    };
  }

  try {
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    const admin = getAdminClient();
    const isWebP = file.type === 'image/webp';
    let buffer: Buffer;
    let blurhash: string | undefined;

    if (isWebP) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      blurhash = await generateBlurhashFromBuffer(buffer);
    } else {
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

    const sanitizedTitle = sanitizeFilename(titleEn || 'untitled');
    const fileName = `blog/images/${Date.now()}-${sanitizedTitle}.webp`;

    const { error: uploadError } = await admin.storage
      .from('website')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = admin.storage
      .from('website')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        image: urlData.publicUrl,
        blurhashURL: blurhash ?? '',
        path: fileName,
      },
    };
  } catch (error) {
    console.error('Error uploading blog image for new post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/** Rollback a created post and its uploaded image (e.g. on apply failure). */
async function rollbackBlogCreate(
  postId: number,
  imagePath: string
): Promise<BlogResult> {
  try {
    await requireAllowedPostWriter();
  } catch {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const admin = getAdminClient();
    await admin.storage.from('website').remove([imagePath]);
    const { error } = await admin.from('blog_posts').delete().eq('id', postId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error rolling back blog create:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rollback failed',
    };
  }
}

async function uploadBlogImage(
  _supabase: SupabaseClient,
  blogId: number,
  file: File,
  currentImageUrl?: string
): Promise<BlogResult> {
  try {
    await requireAllowedPostWriter();
  } catch {
    return {
      success: false,
      error: 'Unauthorized: You do not have permission to upload images',
    };
  }

  try {
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    const admin = getAdminClient();

    const { data: existingBlog, error: fetchError } = await admin
      .from('blog_posts')
      .select('id, title_en')
      .eq('id', blogId)
      .single();

    if (fetchError || !existingBlog) {
      return { success: false, error: 'Blog post not found' };
    }

    if (currentImageUrl) {
      await backupOldFile(admin, currentImageUrl, 'website');
    }

    const isWebP = file.type === 'image/webp';
    let buffer: Buffer;
    let blurhash: string | undefined;

    if (isWebP) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      blurhash = await generateBlurhashFromBuffer(buffer);
    } else {
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

    const sanitizedTitle = sanitizeFilename(
      existingBlog.title_en || 'untitled'
    );
    const fileName = `blog/images/${blogId}-${sanitizedTitle}.webp`;

    await admin.storage.from('website').remove([fileName]);

    const { error: uploadError } = await admin.storage
      .from('website')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = admin.storage
      .from('website')
      .getPublicUrl(fileName);

    const updateData: { image: string; blurhashURL?: string | null } = {
      image: urlData.publicUrl,
    };
    if (blurhash !== undefined) {
      updateData.blurhashURL = blurhash || null;
    }

    const { error: updateError } = await admin
      .from('blog_posts')
      .update(updateData)
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
