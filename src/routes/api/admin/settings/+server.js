import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireAdmin } from '$lib/utils/adminAuth.js';

const updateSettingsSchema = z.object({
  image_provider: z.enum(['openai', 'replicate'])
});

// GET: Read current settings
export async function GET({ locals }) {
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check admin privileges
    await requireAdmin(locals.supabase, session.user.id, session.user.email);
  } catch (err) {
    return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { data, error } = await locals.supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('Settings fetch error:', error);
    // Return default if table doesn't exist yet
    return json({ 
      id: 'main',
      image_provider: 'openai',
      updated_at: null,
      updated_by: null
    });
  }

  return json(data || {
    id: 'main',
    image_provider: 'openai',
    updated_at: null,
    updated_by: null
  });
}

// PATCH: Update settings
export async function PATCH({ request, locals }) {
  const session = await locals.getSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check admin privileges
    await requireAdmin(locals.supabase, session.user.id, session.user.email);
  } catch (err) {
    return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const result = updateSettingsSchema.safeParse(body);

  if (!result.success) {
    return json({ 
      error: result.error.errors[0].message 
    }, { status: 400 });
  }

  const { image_provider } = result.data;

  // Upsert settings
  const { data, error } = await locals.supabase
    .from('app_settings')
    .upsert({
      id: 'main',
      image_provider,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('Settings update error:', error);
    return json({ error: 'Failed to update settings' }, { status: 500 });
  }

  console.log('Settings updated:', {
    image_provider,
    updated_by: session.user.id
  });

  return json({ success: true, settings: data });
}

