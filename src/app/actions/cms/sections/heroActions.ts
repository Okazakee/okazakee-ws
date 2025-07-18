'use server';
import { createClient } from '@/utils/supabase/server';
import { getHeroSection, getResumeLink } from '@/utils/getData';
import { encode } from 'blurhash';
import type { SupabaseClient } from '@supabase/supabase-js';

type HeroOperation =
  | { type: 'GET' }
  | { type: 'UPDATE'; data: HeroUpdateData }
  | { type: 'UPLOAD_IMAGE'; file: File; currentImageUrl?: string }
  | {
      type: 'UPLOAD_RESUME';
      file: File;
      field: 'resume_en' | 'resume_it';
      currentResumeUrl?: string;
    }
  | {
      type: 'UPDATE_WITH_FILES';
      files: HeroFileData;
      currentData?: HeroCurrentData;
    };

type HeroUpdateData = {
  name?: string;
  role?: string;
  about?: string;
  propic?: string;
  blurhashURL?: string;
  resume_en?: string;
  resume_it?: string;
};

type HeroFileData = {
  propic?: File;
  resume_en?: File;
  resume_it?: File;
};

type HeroCurrentData = {
  propic?: string;
  resume_en?: string;
  resume_it?: string;
};

type HeroResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export async function heroActions(
  operation: HeroOperation
): Promise<HeroResult> {
  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getHeroData(supabase);

      case 'UPDATE':
        return await updateHero(supabase, operation.data);

      case 'UPLOAD_IMAGE':
        return await uploadHeroImage(
          supabase,
          operation.file,
          operation.currentImageUrl
        );

      case 'UPLOAD_RESUME':
        return await uploadResume(
          supabase,
          operation.file,
          operation.field,
          operation.currentResumeUrl
        );

      case 'UPDATE_WITH_FILES':
        return await updateWithFiles(
          supabase,
          operation.files,
          operation.currentData
        );

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Hero action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getHeroData(supabase: SupabaseClient): Promise<HeroResult> {
  try {
    const heroSection = await getHeroSection();
    const resumeData = await getResumeLink();

    if (!heroSection) {
      return {
        success: false,
        error: 'Hero section not found',
      };
    }

    return {
      success: true,
      data: {
        hero: heroSection,
        resume: resumeData,
      },
    };
  } catch (error) {
    console.error('Error fetching hero data:', error);
    return {
      success: false,
      error: 'Failed to fetch hero data',
    };
  }
}

async function updateHero(
  supabase: SupabaseClient,
  updateData: HeroUpdateData
): Promise<HeroResult> {
  try {
    const { data, error } = await supabase
      .from('hero_section')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating hero:', error);
    return {
      success: false,
      error: 'Failed to update hero section',
    };
  }
}

async function uploadHeroImage(
  supabase: SupabaseClient,
  file: File,
  currentImageUrl?: string
): Promise<HeroResult> {
  try {
    // Backup old image if it exists
    if (currentImageUrl) {
      await backupOldFile(supabase, currentImageUrl, 'website');
    }

    // Generate blurhash
    const blurhash = await generateBlurhashFromFile(file);

    // Upload to Supabase Storage
    const fileName = `hero/profile_${Date.now()}.${file.name.split('.').pop()}`;
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

    // Update hero section with new image URL and blurhash
    const { error: updateError } = await supabase
      .from('hero_section')
      .update({
        propic: urlData.publicUrl,
        blurhashURL: blurhash,
      })
      .eq('id', 1);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { propic: urlData.publicUrl, blurhashURL: blurhash },
    };
  } catch (error) {
    console.error('Error uploading hero image:', error);
    return {
      success: false,
      error: 'Failed to upload hero image',
    };
  }
}

async function uploadResume(
  supabase: SupabaseClient,
  file: File,
  field: 'resume_en' | 'resume_it',
  currentResumeUrl?: string
): Promise<HeroResult> {
  try {
    // Backup old resume if it exists
    if (currentResumeUrl) {
      await backupOldFile(supabase, currentResumeUrl, 'website');
    }

    // Upload to Supabase Storage
    const fileName = `resumes/${field}_${Date.now()}.${file.name
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

    // Update resume link
    const { error: updateError } = await supabase
      .from('resume_links')
      .update({
        [field]: urlData.publicUrl,
      })
      .eq('id', 1);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { [field]: urlData.publicUrl },
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    return {
      success: false,
      error: 'Failed to upload resume',
    };
  }
}

async function updateWithFiles(
  supabase: SupabaseClient,
  files: HeroFileData,
  currentData?: HeroCurrentData
): Promise<HeroResult> {
  try {
    const updates: HeroUpdateData = {};
    const resumeUpdates: Record<string, string> = {};

    // Handle profile picture upload
    if (files.propic) {
      const imageResult = await uploadHeroImage(
        supabase,
        files.propic,
        currentData?.propic
      );
      if (!imageResult.success) {
        return imageResult;
      }
      const imageData = imageResult.data as {
        propic: string;
        blurhashURL: string;
      };
      updates.propic = imageData.propic;
      updates.blurhashURL = imageData.blurhashURL;
    }

    // Handle resume uploads
    if (files.resume_en) {
      const resumeResult = await uploadResume(
        supabase,
        files.resume_en,
        'resume_en',
        currentData?.resume_en
      );
      if (!resumeResult.success) {
        return resumeResult;
      }
      const resumeData = resumeResult.data as { resume_en: string };
      resumeUpdates.resume_en = resumeData.resume_en;
    }

    if (files.resume_it) {
      const resumeResult = await uploadResume(
        supabase,
        files.resume_it,
        'resume_it',
        currentData?.resume_it
      );
      if (!resumeResult.success) {
        return resumeResult;
      }
      const resumeData = resumeResult.data as { resume_it: string };
      resumeUpdates.resume_it = resumeData.resume_it;
    }

    return {
      success: true,
      data: { ...updates, ...resumeUpdates },
    };
  } catch (error) {
    console.error('Error updating with files:', error);
    return {
      success: false,
      error: 'Failed to update with files',
    };
  }
}

async function generateBlurhashFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, img.width, img.height);

        if (!imageData) {
          reject(new Error('Could not get image data'));
          return;
        }

        const blurhash = encode(
          imageData.data,
          imageData.width,
          imageData.height,
          4,
          4
        );

        resolve(blurhash);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

async function backupOldFile(
  supabase: SupabaseClient,
  currentUrl: string,
  bucket: string
): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = currentUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName) return;

    // Create backup filename
    const timestamp = Date.now();
    const backupFileName = `${fileName.replace(
      /\.[^/.]+$/,
      ''
    )}-bak-${timestamp}${fileName.match(/\.[^/.]+$/)?.[0] || ''}`;

    // Copy file to backup location
    const { data, error } = await supabase.storage
      .from(bucket)
      .copy(
        `Website Assets/${
          fileName.includes('profile') ? 'hero' : 'resumes'
        }/${fileName}`,
        `Website Assets/${
          fileName.includes('profile') ? 'hero' : 'resumes'
        }/backups/${backupFileName}`
      );

    if (error) {
      console.warn('Failed to backup old file:', error);
    }
  } catch (error) {
    console.warn('Error backing up old file:', error);
  }
}
