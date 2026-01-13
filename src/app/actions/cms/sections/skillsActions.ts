'use server';

import {
  backupOldFile,
  processImage,
  requireAdmin,
  sanitizeFilename,
  validateImageFile,
} from '@/app/actions/cms/utils/fileHelpers';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type SkillOperation =
  | { type: 'GET' }
  | { type: 'CREATE'; data: CreateSkillData }
  | { type: 'UPDATE'; id: number; data: UpdateSkillData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_ICON';
      skillId: number;
      file: File;
      currentIconUrl?: string;
    }
  | { type: 'CREATE_CATEGORY'; data: CreateCategoryData }
  | { type: 'UPDATE_CATEGORY'; id: number; data: UpdateCategoryData }
  | { type: 'DELETE_CATEGORY'; id: number };

type CreateSkillData = {
  title: string;
  icon: string;
  invert: boolean;
  name?: string;
  description?: string;
  category_id?: number;
  position?: number;
  icon_url?: string;
  blurhashURL?: string;
};

type UpdateSkillData = {
  name?: string;
  description?: string;
  category_id?: number;
  position?: number;
  icon_url?: string;
  blurhashURL?: string;
};

type CreateCategoryData = {
  name: string;
};

type UpdateCategoryData = {
  name?: string;
};

type SkillsResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validateSkillData(
  data: CreateSkillData | UpdateSkillData
): { isValid: boolean; error?: string } {
  // Title validation (for CreateSkillData)
  if ('title' in data && data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      return { isValid: false, error: 'Skill title is required' };
    }
    if (data.title.length > 100) {
      return { isValid: false, error: 'Skill title must be less than 100 characters' };
    }
  }

  // Name validation
  if (data.name !== undefined && data.name.trim().length === 0) {
    return { isValid: false, error: 'Skill name cannot be empty' };
  }
  if (data.name && data.name.length > 100) {
    return { isValid: false, error: 'Skill name must be less than 100 characters' };
  }

  // Description validation
  if (data.description && data.description.length > 500) {
    return { isValid: false, error: 'Description must be less than 500 characters' };
  }

  // Position validation
  if (data.position !== undefined && (data.position < 0 || !Number.isInteger(data.position))) {
    return { isValid: false, error: 'Position must be a non-negative integer' };
  }

  // Category ID validation
  if (data.category_id !== undefined && (data.category_id < 1 || !Number.isInteger(data.category_id))) {
    return { isValid: false, error: 'Invalid category ID' };
  }

  return { isValid: true };
}

export async function skillsActions(
  operation: SkillOperation
): Promise<SkillsResult> {
  // Admin check - only admins can manage skills
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getSkills(supabase);

      case 'CREATE':
        return await createSkill(supabase, operation.data);

      case 'UPDATE':
        return await updateSkill(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deleteSkill(supabase, operation.id);

      case 'UPLOAD_ICON':
        return await uploadSkillIcon(
          supabase,
          operation.skillId,
          operation.file,
          operation.currentIconUrl
        );

      case 'CREATE_CATEGORY':
        return await createCategory(supabase, operation.data);

      case 'UPDATE_CATEGORY':
        return await updateCategory(supabase, operation.id, operation.data);

      case 'DELETE_CATEGORY':
        return await deleteCategory(supabase, operation.id);

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Skills action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getSkills(supabase: SupabaseClient): Promise<SkillsResult> {
  try {
    const { data, error } = await supabase.from('skills_categories').select(`
      *,
      skills (
        *,
        category_id
      )
    `);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching skills:', error);
    return {
      success: false,
      error: 'Failed to fetch skills data',
    };
  }
}

async function createSkill(
  supabase: SupabaseClient,
  skillData: CreateSkillData
): Promise<SkillsResult> {
  try {
    // Validate input data
    const validation = validateSkillData(skillData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase
      .from('skills')
      .insert(skillData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating skill:', error);
    return {
      success: false,
      error: 'Failed to create skill',
    };
  }
}

async function updateSkill(
  supabase: SupabaseClient,
  skillId: number,
  updateData: UpdateSkillData
): Promise<SkillsResult> {
  try {
    // Validate input data
    const validation = validateSkillData(updateData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if skill exists
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('id')
      .eq('id', skillId)
      .single();

    if (fetchError || !existingSkill) {
      return { success: false, error: 'Skill not found' };
    }

    const { data, error } = await supabase
      .from('skills')
      .update(updateData)
      .eq('id', skillId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating skill:', error);
    return {
      success: false,
      error: 'Failed to update skill',
    };
  }
}

async function deleteSkill(
  supabase: SupabaseClient,
  skillId: number
): Promise<SkillsResult> {
  try {
    const { error } = await supabase.from('skills').delete().eq('id', skillId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting skill:', error);
    return {
      success: false,
      error: 'Failed to delete skill',
    };
  }
}

async function uploadSkillIcon(
  supabase: SupabaseClient,
  skillId: number,
  file: File,
  currentIconUrl?: string
): Promise<SkillsResult> {
  try {
    // Validate file
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if skill exists and get title for filename
    const { data: existingSkill, error: fetchError } = await supabase
      .from('skills')
      .select('id, title')
      .eq('id', skillId)
      .single();

    if (fetchError || !existingSkill) {
      return { success: false, error: 'Skill not found' };
    }

    // Backup old icon if it exists
    if (currentIconUrl) {
      await backupOldFile(supabase, currentIconUrl, 'website');
    }

    // Process image: resize, convert to WebP, generate blurhash
    const processed = await processImage(file);
    if (!processed.success || !processed.buffer) {
      return { success: false, error: processed.error || 'Failed to process image' };
    }
    const { buffer, blurhash } = processed;

    // Generate filename: {skillId}-{title}.webp
    const sanitizedTitle = sanitizeFilename(existingSkill.title || 'skill');
    const fileName = `skills/${skillId}-${sanitizedTitle}.webp`;

    // Delete old file if exists
    await supabase.storage.from('website').remove([fileName]);

    // Upload processed image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('website')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('website')
      .getPublicUrl(fileName);

    // Update skill with new icon URL and blurhash
    const { error: updateError } = await supabase
      .from('skills')
      .update({
        icon_url: urlData.publicUrl,
        blurhashURL: blurhash,
      })
      .eq('id', skillId);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { icon_url: urlData.publicUrl, blurhashURL: blurhash },
    };
  } catch (error) {
    console.error('Error uploading skill icon:', error);
    return {
      success: false,
      error: 'Failed to upload skill icon',
    };
  }
}

async function createCategory(
  supabase: SupabaseClient,
  categoryData: CreateCategoryData
): Promise<SkillsResult> {
  try {
    if (!categoryData.name || categoryData.name.trim().length === 0) {
      return { success: false, error: 'Category name is required' };
    }

    if (categoryData.name.length > 100) {
      return { success: false, error: 'Category name must be less than 100 characters' };
    }

    const { data, error } = await supabase
      .from('skills_categories')
      .insert({ name: categoryData.name.trim() })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: 'Failed to create category',
    };
  }
}

async function updateCategory(
  supabase: SupabaseClient,
  categoryId: number,
  updateData: UpdateCategoryData
): Promise<SkillsResult> {
  try {
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        return { success: false, error: 'Category name cannot be empty' };
      }
      if (updateData.name.length > 100) {
        return { success: false, error: 'Category name must be less than 100 characters' };
      }
    }

    const { data: existingCategory, error: fetchError } = await supabase
      .from('skills_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (fetchError || !existingCategory) {
      return { success: false, error: 'Category not found' };
    }

    const { data, error } = await supabase
      .from('skills_categories')
      .update({ name: updateData.name?.trim() })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: 'Failed to update category',
    };
  }
}

async function deleteCategory(
  supabase: SupabaseClient,
  categoryId: number
): Promise<SkillsResult> {
  try {
    // Check if category has skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .eq('category_id', categoryId);

    if (skillsError) throw skillsError;

    if (skills && skills.length > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${skills.length} skill(s). Remove all skills first.`,
      };
    }

    const { error } = await supabase
      .from('skills_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: 'Failed to delete category',
    };
  }
}
