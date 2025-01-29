'use server';

import { createClient } from '@/utils/supabase/server';

export async function getUser() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  const user = {
    id: data.user?.id || '',
    email: data.user?.email || '',
    propic: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website/Website Assets/profile-pictures/${data.user?.id}.jpeg`,
    role: data.user?.role || '',
  };

  return user;
}
