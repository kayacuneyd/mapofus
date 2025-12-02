import { json } from '@sveltejs/kit';

export async function PATCH({ params, request, locals }) {
  const session = await locals.getSession();
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin
  // if (session.user.email !== 'admin@mapofus.com') return json({ error: 'Forbidden' }, { status: 403 });

  const { id } = params;
  const { status } = await request.json();

  const { error } = await locals.supabase
    .from('maps')
    .update({ payment_status: status })
    .eq('id', id);

  if (error) return json({ error: error.message }, { status: 500 });

  return json({ success: true });
}
