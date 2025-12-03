import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals }) {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/auth/login');

  const { id } = params;

  const { data: map, error: dbError } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !map) {
    throw error(404, 'Map not found');
  }

  if (map.user_id !== session.user.id) {
    throw error(403, 'Forbidden');
  }

  return { map };
}
