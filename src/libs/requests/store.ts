/**
 * Storage for the public intake, through the service-role client.
 *
 * `project_requests` is created by the CMS migration
 * (20261004130000_add_project_requests.sql) and carries no anon/authenticated
 * grant, so this is the only client that can write it. The key stays
 * server-side: the browser posts to the route handler, never to the Data API.
 *
 * Requests are operational data, never public content: nothing here touches
 * the cache-tag vocabulary and no revalidation event is emitted.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicConfig } from '@/config/public';
import { supabaseServerSecret } from '@/config/requests';
import type { RequestIntakePayload } from '@/libs/requests/intake';

let cachedClient: SupabaseClient | null = null;

function adminClient(): SupabaseClient {
  if (!supabaseServerSecret) {
    throw new Error(
      'SUPABASE_SECRET_KEY is required to accept project requests'
    );
  }
  if (!cachedClient) {
    // The runtime schema makes the inferred generic wider than
    // `SupabaseClient`, whose schema parameter defaults to the literal
    // "public"; the widening is asserted once, where the client is built.
    cachedClient = createClient(
      publicConfig.supabaseUrl,
      supabaseServerSecret,
      {
        db: { schema: publicConfig.supabaseSchema },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    ) as SupabaseClient;
  }
  return cachedClient;
}

export type StoreRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Inserts one validated request. A failure here means the visitor's message
 * was NOT stored, so the error is surfaced verbatim to the caller rather than
 * swallowed into a generic success.
 */
export async function storeRequest(
  payload: RequestIntakePayload
): Promise<StoreRequestResult> {
  const { data, error } = await adminClient()
    .from('project_requests')
    .insert({
      locale: payload.locale,
      name: payload.name,
      email: payload.email,
      company: payload.company,
      website: payload.website,
      project_type: payload.type,
      budget: payload.budget,
      timeline: payload.timeline,
      request: payload.request,
      consent: payload.consent,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Request intake insert failed:', error.message);
    return { ok: false, error: error.message };
  }

  const id = data?.id;
  return typeof id === 'string' || typeof id === 'number'
    ? { ok: true, id: String(id) }
    : { ok: false, error: 'Insert returned no row id' };
}
