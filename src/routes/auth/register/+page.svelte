<script>
  import { enhance } from '$app/forms';
  
  export let form;
</script>

<div class="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Hesap Oluştur
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Veya
      <a href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
        giriş yap
      </a>
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" method="POST" use:enhance>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">
            Email adresi
          </label>
          <div class="mt-1">
            <input id="email" name="email" type="email" autocomplete="email" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">
            Şifre
          </label>
          <div class="mt-1">
            <input id="password" name="password" type="password" autocomplete="new-password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
        </div>

        <div>
          <label for="confirm_password" class="block text-sm font-medium text-gray-700">
            Şifre Tekrar
          </label>
          <div class="mt-1">
            <input id="confirm_password" name="confirm_password" type="password" autocomplete="new-password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          </div>
        </div>

        {#if form?.error}
          <div class="text-red-600 text-sm text-center">
            {form.error}
          </div>
        {/if}

        {#if form?.message}
          <div class="text-green-600 text-sm text-center">
            {form.message}
          </div>
        {/if}

        <div>
          <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Kayıt Ol
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
