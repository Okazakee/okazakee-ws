'use server';
import { requireAdmin } from '@/app/actions/cms/utils/fileHelpers';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type I18nOperation =
  | { type: 'GET' }
  | { type: 'UPDATE'; locale: string; data: UpdateI18nData };

type UpdateI18nData = {
  translations: Record<string, unknown>;
  privacy_policy?: string;
};

type I18nResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validateI18nData(
  locale: string,
  data: UpdateI18nData
): { isValid: boolean; error?: string } {
  // Locale validation
  const validLocales = ['en', 'it'];
  if (!validLocales.includes(locale)) {
    return { isValid: false, error: `Invalid locale. Must be one of: ${validLocales.join(', ')}` };
  }

  // Translations validation
  if (!data.translations || typeof data.translations !== 'object') {
    return { isValid: false, error: 'Translations must be a valid object' };
  }

  // Check that translations object is not empty
  if (Object.keys(data.translations).length === 0) {
    return { isValid: false, error: 'Translations object cannot be empty' };
  }

  // Privacy policy validation (if provided)
  if (data.privacy_policy !== undefined && data.privacy_policy !== null) {
    if (typeof data.privacy_policy !== 'string') {
      return { isValid: false, error: 'Privacy policy must be a string' };
    }
    if (data.privacy_policy.length > 50000) {
      return { isValid: false, error: 'Privacy policy content is too long (max 50,000 characters)' };
    }
  }

  return { isValid: true };
}

export async function i18nActions(
  operation: I18nOperation
): Promise<I18nResult> {
  // Admin check - only admins can manage i18n
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getI18nData(supabase);

      case 'UPDATE':
        return await updateI18nData(supabase, operation.locale, operation.data);

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('I18n action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getI18nData(supabase: SupabaseClient): Promise<I18nResult> {
  try {
    const { data, error } = await supabase
      .from('i18n_translations')
      .select('*')
      .order('language', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching i18n data:', error);
    return {
      success: false,
      error: 'Failed to fetch i18n data',
    };
  }
}

async function updateI18nData(
  supabase: SupabaseClient,
  locale: string,
  updateData: UpdateI18nData
): Promise<I18nResult> {
  try {
    // Validate input data
    const validation = validateI18nData(locale, updateData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase
      .from('i18n_translations')
      .upsert({
        language: locale,
        translations: updateData.translations,
        privacy_policy: updateData.privacy_policy,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating i18n data:', error);
    return {
      success: false,
      error: 'Failed to update i18n data',
    };
  }
}
