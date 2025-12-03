import { redirect, error } from '@sveltejs/kit';
import { requireAdmin } from '$lib/utils/adminAuth.js';

export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session) {
    console.log('[Admin] No session found, redirecting to login');
    throw redirect(303, '/auth/login');
  }

  console.log(`[Admin] Checking admin access for user: ${session.user.id} (${session.user.email})`);

  // Check admin privileges
  try {
    await requireAdmin(locals.supabase, session.user.id, session.user.email);
  } catch (err) {
    console.error('[Admin] Admin check failed:', {
      userId: session.user.id,
      userEmail: session.user.email,
      error: err.message,
      status: err.status
    });
    throw error(err.status || 403, err.message || 'Forbidden: Admin access required');
  }

  // Fetch all maps with additional fields for admin
  console.log('[Admin] Fetching all maps for admin view');
  const { data: maps, error: mapsError } = await locals.supabase
    .from('maps')
    .select('*')
    .order('created_at', { ascending: false });

  if (mapsError) {
    console.error('[Admin] Error fetching maps:', {
      error: mapsError,
      code: mapsError.code,
      message: mapsError.message,
      details: mapsError.details
    });
    throw error(500, 'Failed to load orders');
  }

  console.log(`[Admin] Successfully loaded ${maps?.length || 0} maps`);

  // Fetch app settings
  const { data: settings, error: settingsError } = await locals.supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'main')
    .single();

  // If settings don't exist, use default
  const imageProvider = settings?.image_provider || 'openai';
  const ruulPaymentLink = settings?.ruul_payment_link || null;
  
  return {
    maps: maps || [],
    session,
    settings: {
      image_provider: imageProvider,
      ruul_payment_link: ruulPaymentLink
    }
  };
}
