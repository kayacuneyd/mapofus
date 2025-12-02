import { error } from '@sveltejs/kit';

export async function GET({ params, locals }) {
  const session = await locals.getSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;

  const { data: map, error: dbError } = await locals.supabase
    .from('maps')
    .select('*')
    .eq('id', id)
    .single();

  if (dbError || !map) {
    throw error(404, 'Map not found');
  }

  // Check ownership
  if (map.user_id !== session.user.id) {
    throw error(403, 'Forbidden');
  }

  // Check payment status
  if (map.payment_status !== 'completed') {
    throw error(402, 'Payment required');
  }

  // Redirect to the HD image URL (which should be a signed URL in a real app)
  // For now, we just redirect to the stored URL
  return new Response(null, {
    status: 302,
    headers: { Location: map.hd_image_url }
  });
}
