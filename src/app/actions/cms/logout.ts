'use server';

import { createClient } from '@/utils/supabase/server';

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  // Do not revalidatePath here: it can trigger layout refetch before the client
  // redirects, causing a client-side exception. The next visit to /cms will load fresh.
  return { success: true };
}
