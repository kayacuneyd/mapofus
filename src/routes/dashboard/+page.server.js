import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/auth/login');

  const { data: maps, error } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching maps:', error);
    return { maps: [] };
  }

  return { maps };
}
