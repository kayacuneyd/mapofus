import { json } from '@sveltejs/kit';
import { z } from 'zod';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  asyncHandler,
  logger
} from '$lib/utils/errors.js';
import { requireAdmin } from '$lib/utils/adminAuth.js';

const updateSchema = z.object({
  order_status: z.enum([
    'pending',
    'invoice_submitted',
    'payment_verifying',
    'payment_confirmed',
    'ready_for_download',
    'completed',
    'payment_rejected',
    'cancelled'
  ]).optional(),
  admin_notes: z.string().max(1000).optional(),
  // Legacy support
  status: z.string().optional()
});

export const PATCH = asyncHandler(async ({ params, request, locals }) => {
  const session = await locals.getSession();
  if (!session) {
    throw new AuthenticationError();
  }

  // Check admin privileges
  try {
    await requireAdmin(locals.supabase, session.user.id, session.user.email);
  } catch (err) {
    throw new AuthorizationError(err.message);
  }

  const { id } = params;
  const body = await request.json();

  // Validate input
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      result.error.errors[0].message,
      result.error.errors[0].path[0]
    );
  }

  const { order_status, admin_notes, status } = result.data;

  // Build update object
  const updates = {
    updated_at: new Date().toISOString()
  };

  // Support both new and legacy field names
  if (order_status) {
    updates.order_status = order_status;

    // Automatically set ready_for_download when payment confirmed
    if (order_status === 'payment_confirmed') {
      updates.order_status = 'ready_for_download';
      updates.payment_verified_at = new Date().toISOString();
      updates.payment_verified_by = session.user.id;

      // Also update legacy field for backward compatibility
      updates.payment_status = 'completed';
    }
  } else if (status) {
    // Legacy support
    updates.payment_status = status;
    if (status === 'completed') {
      updates.order_status = 'ready_for_download';
      updates.payment_verified_at = new Date().toISOString();
      updates.payment_verified_by = session.user.id;
    }
  }

  if (admin_notes !== undefined) {
    updates.admin_notes = admin_notes;
  }

  const { data, error } = await locals.supabase
    .from('maps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Admin update error', {
      mapId: id,
      error: error.message,
      adminId: session.user.id
    });
    throw new Error(error.message);
  }

  logger.info('Admin updated map status', {
    mapId: id,
    adminId: session.user.id,
    newStatus: updates.order_status || updates.payment_status
  });

  return json({ success: true, map: data });
});
