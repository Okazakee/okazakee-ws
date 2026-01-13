'use server';

import {
  backupOldFile,
  isValidDate,
  isValidUrl,
  processImage,
  requireAdmin,
  sanitizeFilename,
  validateImageFile,
} from '@/app/actions/cms/utils/fileHelpers';
import type { CareerEntry } from '@/types/fetchedData.types';
import { getCareerEntries } from '@/utils/getData';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  data?: CareerEntry | CareerEntry[] | { logo: string; blurhashURL: string } | null;
  error?: string;
};

// Validation functions
function validateCareerData(data: CreateCareerData | UpdateCareerData): { isValid: boolean; error?: string } {
  // Required fields validation
  if (data.title !== undefined && (!data.title || data.title.trim().length === 0)) {
    return { isValid: false, error: 'Job title is required' };
  }
  
  if (data.company !== undefined && (!data.company || data.company.trim().length === 0)) {
    return { isValid: false, error: 'Company name is required' };
  }
  
  if (data.description_en !== undefined && (!data.description_en || data.description_en.trim().length === 0)) {
    return { isValid: false, error: 'English description is required' };
  }
  
  if (data.description_it !== undefined && (!data.description_it || data.description_it.trim().length === 0)) {
    return { isValid: false, error: 'Italian description is required' };
  }

  // Length validation
  if (data.title && data.title.length > 200) {
    return { isValid: false, error: 'Job title must be less than 200 characters' };
  }
  
  if (data.company && data.company.length > 200) {
    return { isValid: false, error: 'Company name must be less than 200 characters' };
  }
  
  if (data.description_en && data.description_en.length > 1000) {
    return { isValid: false, error: 'English description must be less than 1000 characters' };
  }
  
  if (data.description_it && data.description_it.length > 1000) {
    return { isValid: false, error: 'Italian description must be less than 1000 characters' };
  }

  // URL validation
  if (data.website_url && data.website_url.trim() && !isValidUrl(data.website_url)) {
    return { isValid: false, error: 'Website URL must be a valid URL' };
  }

  // Date validation
  if (data.startDate && !isValidDate(data.startDate)) {
    return { isValid: false, error: 'Start date must be a valid date' };
  }
  
  if (data.endDate && !isValidDate(data.endDate)) {
    return { isValid: false, error: 'End date must be a valid date' };
  }

  // Date logic validation
  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    return { isValid: false, error: 'Start date cannot be after end date' };
  }

  return { isValid: true };
}

export async function careerActions(
  operation: CareerOperation
): Promise<CareerResult> {
  // Admin check - only admins can manage career
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

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
    // Validate input data
    const validation = validateCareerData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

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
    // Validate input data
    const validation = validateCareerData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if career entry exists
    const { data: existingCareer, error: fetchError } = await supabase
      .from('career_entries')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCareer) {
      return { success: false, error: 'Career entry not found' };
    }

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
    // Check if career entry exists
    const { data: existingCareer, error: fetchError } = await supabase
      .from('career_entries')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCareer) {
      return { success: false, error: 'Career entry not found' };
    }

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
    // Validate file
    const fileValidation = validateImageFile(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if career entry exists and get company name for filename
    const { data: existingCareer, error: fetchError } = await supabase
      .from('career_entries')
      .select('id, company')
      .eq('id', careerId)
      .single();

    if (fetchError || !existingCareer) {
      return { success: false, error: 'Career entry not found' };
    }

    // Backup old logo if it exists
    if (currentLogoUrl) {
      await backupOldFile(supabase, currentLogoUrl, 'website');
    }

    // Process image: resize, convert to WebP, generate blurhash
    const processed = await processImage(file);
    if (!processed.success || !processed.buffer) {
      return { success: false, error: processed.error || 'Failed to process image' };
    }
    const { buffer, blurhash } = processed;

    // Generate filename: {careerId}-{company}.webp
    const sanitizedCompany = sanitizeFilename(existingCareer.company || 'company');
    const fileName = `career/logos/${careerId}-${sanitizedCompany}.webp`;

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
      data: { logo: urlData.publicUrl, blurhashURL: blurhash || '' },
    };
  } catch (error) {
    console.error('Error uploading career logo:', error);
    return {
      success: false,
      error: 'Failed to upload career logo',
    };
  }
}
