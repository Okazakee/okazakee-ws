'use server';
import type { CareerEntry } from '@/types/fetchedData.types';
import { getCareerEntries } from '@/utils/getData';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encode } from 'blurhash';

type CareerOperation =
  | { type: 'GET' }
  | { type: 'CREATE'; data: CreateCareerData }
  | { type: 'UPDATE'; id: number; data: UpdateCareerData }
  | { type: 'DELETE'; id: number }
  | {
      type: 'UPLOAD_LOGO';
      careerId: number;
      file: File;
      currentLogoUrl?: string;
    };

type CreateCareerData = {
  title: string;
  company: string;
  website_url: string;
  logo: string;
  blurhashURL: string;
  location_en: string;
  location_it: string;
  remote: 'full' | 'hybrid' | 'onSite';
  startDate: string;
  endDate: string | null;
  description_en: string;
  description_it: string;
  skills: string;
  company_description_en: string;
  company_description_it: string;
};

type UpdateCareerData = Partial<CreateCareerData>;

type CareerResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export async function careerActions(
  operation: CareerOperation
): Promise<CareerResult> {
  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getCareerData(supabase);

      case 'CREATE':
        return await createCareer(supabase, operation.data);

      case 'UPDATE':
        return await updateCareer(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deleteCareer(supabase, operation.id);

      case 'UPLOAD_LOGO':
        return await uploadCareerLogo(
          supabase,
          operation.careerId,
          operation.file,
          operation.currentLogoUrl
        );

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Career action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getCareerData(supabase: SupabaseClient): Promise<CareerResult> {
  try {
    const careerEntries = await getCareerEntries();
    return { success: true, data: careerEntries };
  } catch (error) {
    console.error('Error fetching career data:', error);
    return {
      success: false,
      error: 'Failed to fetch career data',
    };
  }
}

async function createCareer(
  supabase: SupabaseClient,
  data: CreateCareerData
): Promise<CareerResult> {
  try {
    const { data: newCareer, error } = await supabase
      .from('career_entries')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: newCareer };
  } catch (error) {
    console.error('Error creating career entry:', error);
    return {
      success: false,
      error: 'Failed to create career entry',
    };
  }
}

async function updateCareer(
  supabase: SupabaseClient,
  id: number,
  data: UpdateCareerData
): Promise<CareerResult> {
  try {
    const { data: updatedCareer, error } = await supabase
      .from('career_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: updatedCareer };
  } catch (error) {
    console.error('Error updating career entry:', error);
    return {
      success: false,
      error: 'Failed to update career entry',
    };
  }
}

async function deleteCareer(
  supabase: SupabaseClient,
  id: number
): Promise<CareerResult> {
  try {
    const { error } = await supabase
      .from('career_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting career entry:', error);
    return {
      success: false,
      error: 'Failed to delete career entry',
    };
  }
}

async function uploadCareerLogo(
  supabase: SupabaseClient,
  careerId: number,
  file: File,
  currentLogoUrl?: string
): Promise<CareerResult> {
  try {
    // Backup old logo if it exists
    if (currentLogoUrl) {
      await backupOldFile(supabase, currentLogoUrl, 'website');
    }

    // Generate blurhash
    const blurhash = await generateBlurhashFromFile(file);

    // Upload to Supabase Storage
    const fileName = `career/logos/${careerId}_${Date.now()}.${file.name
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

    // Update career entry with new logo URL and blurhash
    const { error: updateError } = await supabase
      .from('career_entries')
      .update({
        logo: urlData.publicUrl,
        blurhashURL: blurhash,
      })
      .eq('id', careerId);

    if (updateError) throw updateError;

    return {
      success: true,
      data: { logo: urlData.publicUrl, blurhashURL: blurhash },
    };
  } catch (error) {
    console.error('Error uploading career logo:', error);
    return {
      success: false,
      error: 'Failed to upload career logo',
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
