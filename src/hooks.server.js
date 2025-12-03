import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { sequence } from '@sveltejs/kit/hooks';

// Supabase initialization hook
const supabaseHook = async ({ event, resolve }) => {
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

// Global error handling hook
const errorHandlingHook = async ({ event, resolve }) => {
  try {
    const response = await resolve(event);
    return response;
  } catch (err) {
    // Log error details
    console.error(JSON.stringify({
      level: 'error',
      message: 'Unhandled error',
      path: event.url.pathname,
      method: event.request.method,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    // Return user-friendly error
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred',
        message: err.message || 'Internal server error',
        path: event.url.pathname
      }),
      {
        status: err.status || 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const handle = sequence(supabaseHook, errorHandlingHook);
