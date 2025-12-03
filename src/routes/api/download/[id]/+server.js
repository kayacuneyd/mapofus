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

  // Check payment status - support both new and legacy fields
  const canDownload = ['ready_for_download', 'completed'].includes(map.order_status)
    || map.payment_status === 'completed'; // backward compatibility

  if (!canDownload) {
    throw error(402, 'Payment required');
  }

  // Track download
  const { error: updateError } = await locals.supabase
    .from('maps')
    .update({
      downloaded_at: new Date().toISOString(),
      order_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    console.error('Failed to track download:', updateError);
    // Don't block download on tracking failure
  }

  // Redirect to the HD image URL
  return new Response(null, {
    status: 302,
    headers: { Location: map.hd_image_url }
  });
}
