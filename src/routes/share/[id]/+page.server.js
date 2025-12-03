import { error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

const PUBLIC_FIELDS = 'id, story_text, thumbnail_url, created_at, order_status, payment_status, story_metadata';

export async function load({ params }) {
  if (!SUPABASE_SERVICE_ROLE_KEY || !PUBLIC_SUPABASE_URL) {
    throw error(500, 'Service misconfigured');
  }

  const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { id } = params;
  const { data: map, error: dbError } = await supabaseAdmin
    .from('maps')
    .select(PUBLIC_FIELDS)
    .eq('id', id)
    .single();

  if (dbError || !map) {
    throw error(404, 'Map not found');
  }

  return { map };
}
