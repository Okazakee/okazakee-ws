'use server';
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

export async function i18nActions(
  operation: I18nOperation
): Promise<I18nResult> {
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
