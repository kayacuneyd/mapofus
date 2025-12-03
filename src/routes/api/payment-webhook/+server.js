import { json } from '@sveltejs/kit';

/**
 * DEPRECATED: This endpoint has been replaced with manual invoice-based payment verification
 *
 * The new payment flow:
 * 1. User pays externally and receives invoice number
 * 2. User submits invoice number via /api/maps/[id]/invoice
 * 3. Admin reviews and approves/rejects via admin panel
 *
 * This endpoint returns 410 Gone to indicate it's been permanently removed
 */

export async function POST() {
  return json({
    error: 'This endpoint has been deprecated. Payment is now handled manually via invoice submission.'
  }, { status: 410 }); // 410 Gone
}
