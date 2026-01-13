'use server';

import { isValidUrl, requireAdmin } from '@/app/actions/cms/utils/fileHelpers';
import { getContacts } from '@/utils/getData';
import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type ContactOperation =
  | { type: 'GET' }
  | { type: 'CREATE'; data: CreateContactData }
  | { type: 'UPDATE'; id: number; data: UpdateContactData }
  | { type: 'DELETE'; id: number }
  | { type: 'REORDER'; contacts: { id: number; position: number }[] };

type CreateContactData = {
  label: string;
  icon: string;
  link: string;
  bg_color: string;
  position: number;
};

type UpdateContactData = {
  label?: string;
  icon?: string;
  link?: string;
  bg_color?: string;
  position?: number;
};

type ContactsResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Validation functions
function validateContactData(
  data: CreateContactData | UpdateContactData
): { isValid: boolean; error?: string } {
  // Label validation
  if ('label' in data && data.label !== undefined) {
    if (!data.label || data.label.trim().length === 0) {
      return { isValid: false, error: 'Contact label is required' };
    }
    if (data.label.length > 50) {
      return { isValid: false, error: 'Label must be less than 50 characters' };
    }
  }

  // Icon validation
  if ('icon' in data && data.icon !== undefined) {
    if (!data.icon || data.icon.trim().length === 0) {
      return { isValid: false, error: 'Icon name is required' };
    }
    if (data.icon.length > 50) {
      return { isValid: false, error: 'Icon name must be less than 50 characters' };
    }
  }

  // Link validation
  if ('link' in data && data.link !== undefined) {
    if (!data.link || data.link.trim().length === 0) {
      return { isValid: false, error: 'Contact link is required' };
    }
    if (!isValidUrl(data.link) && !data.link.startsWith('mailto:') && !data.link.startsWith('tel:')) {
      return { isValid: false, error: 'Link must be a valid URL, email (mailto:), or phone (tel:)' };
    }
  }

  // Background color validation
  if (data.bg_color !== undefined && data.bg_color) {
    const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorPattern.test(data.bg_color)) {
      return { isValid: false, error: 'Background color must be a valid hex color (e.g., #FF5733)' };
    }
  }

  // Position validation
  if (data.position !== undefined && (data.position < 0 || !Number.isInteger(data.position))) {
    return { isValid: false, error: 'Position must be a non-negative integer' };
  }

  return { isValid: true };
}

export async function contactsActions(
  operation: ContactOperation
): Promise<ContactsResult> {
  // Admin check - only admins can manage contacts
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  const supabase = await createClient();

  try {
    switch (operation.type) {
      case 'GET':
        return await getContactsData(supabase);

      case 'CREATE':
        return await createContact(supabase, operation.data);

      case 'UPDATE':
        return await updateContact(supabase, operation.id, operation.data);

      case 'DELETE':
        return await deleteContact(supabase, operation.id);

      case 'REORDER':
        return await reorderContacts(supabase, operation.contacts);

      default:
        return { success: false, error: 'Invalid operation' };
    }
  } catch (error) {
    console.error('Contacts action error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

async function getContactsData(
  supabase: SupabaseClient
): Promise<ContactsResult> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return {
      success: false,
      error: 'Failed to fetch contacts data',
    };
  }
}

async function createContact(
  supabase: SupabaseClient,
  contactData: CreateContactData
): Promise<ContactsResult> {
  try {
    // Validate input data
    const validation = validateContactData(contactData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating contact:', error);
    return {
      success: false,
      error: 'Failed to create contact',
    };
  }
}

async function updateContact(
  supabase: SupabaseClient,
  contactId: number,
  updateData: UpdateContactData
): Promise<ContactsResult> {
  try {
    // Validate input data
    const validation = validateContactData(updateData);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .single();

    if (fetchError || !existingContact) {
      return { success: false, error: 'Contact not found' };
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating contact:', error);
    return {
      success: false,
      error: 'Failed to update contact',
    };
  }
}

async function deleteContact(
  supabase: SupabaseClient,
  contactId: number
): Promise<ContactsResult> {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return {
      success: false,
      error: 'Failed to delete contact',
    };
  }
}

async function reorderContacts(
  supabase: SupabaseClient,
  contacts: { id: number; position: number }[]
): Promise<ContactsResult> {
  try {
    // Update positions in batches
    for (const contact of contacts) {
      const { error } = await supabase
        .from('contacts')
        .update({ position: contact.position })
        .eq('id', contact.id);

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error reordering contacts:', error);
    return {
      success: false,
      error: 'Failed to reorder contacts',
    };
  }
}
