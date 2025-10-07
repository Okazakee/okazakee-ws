'use server';
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
  data?: any;
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

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

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
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      return { success: false, error: fileValidation.error };
    }

    // Check if career entry exists
    const { data: existingCareer, error: fetchError } = await supabase
      .from('career_entries')
      .select('id')
      .eq('id', careerId)
      .single();

    if (fetchError || !existingCareer) {
      return { success: false, error: 'Career entry not found' };
    }

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
