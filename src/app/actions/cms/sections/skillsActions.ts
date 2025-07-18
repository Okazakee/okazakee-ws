'use server';
import { createClient } from '@/utils/supabase/server';
import { encode } from 'blurhash';
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
    };

type CreateSkillData = {
  name: string;
  description: string;
  category_id: number;
  position: number;
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

type SkillsResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export async function skillsActions(
  operation: SkillOperation
): Promise<SkillsResult> {
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
    // Backup old icon if it exists
    if (currentIconUrl) {
      await backupOldIcon(supabase, currentIconUrl, 'website');
    }

    // Generate blurhash
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        const blurhash = encode(
          imageData?.data || new Uint8ClampedArray(),
          img.width,
          img.height,
          4,
          4
        );

        // Upload to Supabase Storage
        const fileName = `skills/${skillId}_${Date.now()}.${file.name
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

        // Update skill with new icon URL and blurhash
        const { error: updateError } = await supabase
          .from('skills')
          .update({
            icon_url: urlData.publicUrl,
            blurhashURL: blurhash,
          })
          .eq('id', skillId);

        if (updateError) throw updateError;

        resolve({
          success: true,
          data: { icon_url: urlData.publicUrl, blurhashURL: blurhash },
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      const blob = new Blob([uint8Array], { type: file.type });
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('Error uploading skill icon:', error);
    return {
      success: false,
      error: 'Failed to upload skill icon',
    };
  }
}

async function backupOldIcon(
  supabase: SupabaseClient,
  currentUrl: string,
  bucket: string
): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = currentUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `skills/${fileName}`;

    // Copy to backup folder
    const { error } = await supabase.storage
      .from(bucket)
      .copy(filePath, `backup/skills/${Date.now()}_${fileName}`);

    if (error) {
      console.warn('Failed to backup old icon:', error);
    }
  } catch (error) {
    console.warn('Error backing up old icon:', error);
  }
}
