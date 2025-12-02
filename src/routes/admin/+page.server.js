import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/auth/login');

  // In a real app, check if user is admin
  // if (session.user.email !== 'admin@mapofus.com') throw error(403, 'Forbidden');

  const { data: maps, error } = await locals.supabase
    .from('maps')
    .select('*')
    .order('created_at', { ascending: false });

  return { maps: maps || [] };
}
