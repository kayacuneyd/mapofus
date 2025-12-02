import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      set: (key, value, options) => {
        event.cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key, options) => {
        event.cookies.delete(key, { ...options, path: '/' });
      },
    },
  });

  event.locals.getSession = async () => {
    const {
      data: { user },
    } = await event.locals.supabase.auth.getUser();
    
    if (user) {
      const { data: { session } } = await event.locals.supabase.auth.getSession();
      return session;
    }
    return null;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range';
    },
  });
};
