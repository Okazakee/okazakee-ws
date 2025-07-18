'use server';
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

export async function contactsActions(
  operation: ContactOperation
): Promise<ContactsResult> {
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
