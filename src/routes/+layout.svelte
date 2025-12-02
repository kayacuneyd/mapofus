<script>
  import "../app.css";
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';

  export let data;

  let { supabase, session } = data;
  $: ({ supabase, session } = data);

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth');
      }
    });

    return () => subscription.unsubscribe();
  });
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <a href="/" class="flex-shrink-0 flex items-center text-xl font-bold text-indigo-600">
            Map of Us
          </a>
        </div>
        <div class="flex items-center">
          {#if session}
            <a href="/dashboard" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
            <form action="/auth/logout" method="POST">
              <button type="submit" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Logout</button>
            </form>
          {:else}
            <a href="/auth/login" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Login</a>
            <a href="/auth/register" class="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Get Started</a>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <main>
    <slot />
  </main>

  <footer class="bg-white mt-12 border-t border-gray-200">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <p class="text-center text-gray-400 text-sm">
        &copy; 2025 Map of Us. All rights reserved.
      </p>
    </div>
  </footer>
</div>
