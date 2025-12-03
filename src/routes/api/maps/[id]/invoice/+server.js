import { json } from '@sveltejs/kit';
import { z } from 'zod';
import {
  ValidationError,
  AuthenticationError,
  asyncHandler,
  logger
} from '$lib/utils/errors.js';

const invoiceSchema = z.object({
  invoice_number: z.string()
    .min(3, 'Fatura numarası en az 3 karakter olmalıdır')
    .max(100, 'Fatura numarası çok uzun')
    .regex(/^[A-Za-z0-9-_]+$/, 'Fatura numarası sadece harf, rakam, tire ve alt çizgi içerebilir')
});

export const POST = asyncHandler(async ({ params, request, locals }) => {
  const session = await locals.getSession();
  if (!session) {
    throw new AuthenticationError();
  }

  const { id } = params;
  const body = await request.json();

  // Validate input
  const result = invoiceSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      result.error.errors[0].message,
      result.error.errors[0].path[0]
    );
  }

  const { invoice_number } = result.data;

  // Verify ownership
  const { data: map, error: fetchError } = await locals.supabase
    .from('maps')
    .select('user_id, order_status')
    .eq('id', id)
    .single();

  if (fetchError || !map) {
    logger.error('Map not found in invoice submission', { mapId: id, error: fetchError?.message });
    throw new ValidationError('Harita bulunamadı');
  }

  if (map.user_id !== session.user.id) {
    logger.warn('Unauthorized invoice submission attempt', {
      mapId: id,
      userId: session.user.id,
      mapOwnerId: map.user_id
    });
    throw new ValidationError('Bu haritaya erişim yetkiniz yok');
  }

  // Check if already submitted
  const blockedStatuses = [
    'invoice_submitted',
    'payment_verifying',
    'payment_confirmed',
    'ready_for_download',
    'completed'
  ];

  if (blockedStatuses.includes(map.order_status)) {
    throw new ValidationError('Fatura zaten gönderilmiş veya ödeme işlenmiş');
  }

  // Check for duplicate invoice numbers
  const { data: existingInvoice } = await locals.supabase
    .from('maps')
    .select('id')
    .eq('invoice_number', invoice_number)
    .neq('id', id)
    .single();

  if (existingInvoice) {
    throw new ValidationError('Bu fatura numarası daha önce kullanılmış');
  }

  // Update map with invoice
  const { data: updatedMap, error: updateError } = await locals.supabase
    .from('maps')
    .update({
      invoice_number,
      invoice_submitted_at: new Date().toISOString(),
      order_status: 'invoice_submitted',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    logger.error('Invoice submission failed', {
      mapId: id,
      error: updateError.message
    });
    throw new Error('Fatura gönderimi başarısız oldu');
  }

  logger.info('Invoice submitted successfully', {
    mapId: id,
    userId: session.user.id,
    invoiceNumber: invoice_number
  });

  return json({
    success: true,
    map: updatedMap
  });
});
