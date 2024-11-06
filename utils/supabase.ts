import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)