import { fail, redirect } from '@sveltejs/kit';
import { AuthApiError } from '@supabase/supabase-js';
import { checkAdminStatus } from '$lib/utils/adminAuth.js';

export const actions = {
  default: async ({ request, locals }) => {
    const body = Object.fromEntries(await request.formData());
    const { email, password, confirm_password } = body;

    if (!email || !password || !confirm_password) {
      return fail(400, { error: 'Tüm alanları doldurunuz.' });
    }

    if (password !== confirm_password) {
      return fail(400, { error: 'Şifreler eşleşmiyor.' });
    }

    if (password.length < 6) {
      return fail(400, { error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const { data, error: err } = await locals.supabase.auth.signUp({
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
