import { json } from '@sveltejs/kit';
import { RUUL_WEBHOOK_SECRET } from '$env/static/private';

export async function POST({ request, locals }) {
  // Verify webhook signature (simplified)
  const signature = request.headers.get('x-ruul-signature');
  if (!signature) { // In real app, verify signature with RUUL_WEBHOOK_SECRET
    // return json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    
    // Assuming payload structure from Ruul.io
    // { id: 'trans_123', status: 'success', metadata: { map_id: '...' } }
    
    const { id: transactionId, status, metadata } = payload;
    const mapId = metadata?.map_id;

    if (status === 'success' && mapId) {
      const { error } = await locals.supabase
        .from('maps')
        .update({
          payment_status: 'completed',
          ruul_payment_id: transactionId,
          ruul_payment_data: payload
        })
        .eq('id', mapId);

      if (error) {
        console.error('Webhook DB Error:', error);
        return json({ error: 'Database update failed' }, { status: 500 });
      }
    }

    return json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
