import { fail, redirect } from '@sveltejs/kit';
import { AuthApiError } from '@supabase/supabase-js';
import { checkAdminStatus } from '$lib/utils/adminAuth.js';

export const actions = {
  default: async ({ request, locals }) => {
    const body = Object.fromEntries(await request.formData());
    const { email, password } = body;

    if (!email || !password) {
      return fail(400, { error: 'Email ve şifre gereklidir.' });
    }

    const { data, error: err } = await locals.supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (err) {
      if (err instanceof AuthApiError && err.status === 400) {
        return fail(400, {
          error: 'Geçersiz email veya şifre.',
        });
      }
      return fail(500, {
        error: 'Sunucu hatası. Lütfen tekrar deneyiniz.',
      });
    }

    const userId = data?.user?.id;
    let target = '/dashboard';

    if (userId) {
      const { isAdmin } = await checkAdminStatus(locals.supabase, userId);
      if (isAdmin) target = '/admin';
    }

    throw redirect(303, target);
  },
};
