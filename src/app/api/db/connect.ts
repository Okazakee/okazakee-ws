'use server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database.types';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

const supabase: SupabaseClient = createClient<Database>(supabaseUrl, supabaseKey);

export const fetchBio = async () => {

  const { data, error } = await supabase
  .from('biography')
  .select('propic, aboutmedesc, headerdesc')

  console.log(data![0])

  if (error) {

    console.error('Error fetching data:', error)

  } else {

    return data[0]

  }
}