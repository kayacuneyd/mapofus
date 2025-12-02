<script>
  import { goto } from '$app/navigation';
  
  let loading = false;
  let error = null;
  
  async function handleSubmit(event) {
    loading = true;
    error = null;
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Bir hata oluştu');
      }
      
      goto(`/preview/${result.id}`);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
  <div class="md:flex md:items-center md:justify-between mb-8">
    <div class="flex-1 min-w-0">
      <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
        Hikayenizi Oluşturun
      </h2>
    </div>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-8 divide-y divide-gray-200 bg-white p-8 shadow rounded-lg">
    <div class="space-y-8 divide-y divide-gray-200">
      <div>
        <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-6">
            <label for="story_text" class="block text-sm font-medium text-gray-700">
              Hikayeniz (500-750 kelime)
            </label>
            <div class="mt-1">
              <textarea id="story_text" name="story_text" rows="10" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md" placeholder="İlişkiniz nasıl başladı? En güzel anılarınız neler?..." required minlength="500"></textarea>
            </div>
            <p class="mt-2 text-sm text-gray-500">Detaylı bir hikaye, daha iyi bir harita oluşturmamızı sağlar. (En az 500 karakter)</p>
          </div>

          <div class="sm:col-span-3">
            <label for="start_date" class="block text-sm font-medium text-gray-700">
              Başlangıç Tarihi
            </label>
            <div class="mt-1">
              <input type="date" name="start_date" id="start_date" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="theme" class="block text-sm font-medium text-gray-700">
              Tema
            </label>
            <div class="mt-1">
              <select id="theme" name="theme" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                <option value="romantic">Romantik (Sulu Boya)</option>
                <option value="vintage">Vintage (Eski Harita)</option>
                <option value="modern">Modern (Minimalist)</option>
                <option value="minimalist">Sade (Çizgisel)</option>
              </select>
            </div>
          </div>

          <div class="sm:col-span-6">
            <label for="locations" class="block text-sm font-medium text-gray-700">
              Önemli Lokasyonlar
            </label>
            <div class="mt-1">
              <input type="text" name="locations" id="locations" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="İstanbul, Paris, Kapadokya (Virgülle ayırın)">
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if error}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Hata</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <div class="pt-5">
      <div class="flex justify-end">
        <a href="/dashboard" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          İptal
        </a>
        <button type="submit" disabled={loading} class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          {#if loading}
            Oluşturuluyor...
          {:else}
            Harita Oluştur
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>
