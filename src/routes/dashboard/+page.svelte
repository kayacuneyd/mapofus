<script>
  import { Plus, Download, Clock, Map, Share2 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  export let data;
  let { maps } = data;

  let shareMessage = '';
  let origin = '';

  onMount(() => {
    origin = window.location.origin;
  });

  async function shareMap(map) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/preview/${map.id}` : '';
    if (!url) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Haritam',
          text: 'Haritamı gör',
          url
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        shareMessage = 'Bağlantı kopyalandı';
        setTimeout(() => (shareMessage = ''), 2000);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Haritalarım</h1>
      <a href="/create" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        <Plus class="h-5 w-5 mr-2" />
        Yeni Harita Oluştur
      </a>
    </div>

    {#if maps.length === 0}
      <div class="text-center py-12 bg-white rounded-lg shadow">
        <Map class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Henüz haritanız yok</h3>
        <p class="mt-1 text-sm text-gray-500">İlişki hikayenizi anlatarak ilk haritanızı oluşturun.</p>
        <div class="mt-6">
          <a href="/create" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus class="h-5 w-5 mr-2" />
            Yeni Harita Oluştur
          </a>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each maps as map}
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="relative h-48 bg-gray-200">
              {#if map.thumbnail_url}
                <img src={map.thumbnail_url} alt="Map preview" class="w-full h-full object-cover" />
              {:else}
                <div class="flex items-center justify-center h-full text-gray-400">
                  <Clock class="h-8 w-8 animate-spin" />
                </div>
              {/if}
              <div class="absolute top-2 right-2">
                {#if map.payment_status === 'completed'}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Tamamlandı
                  </span>
                {:else if map.payment_status === 'pending'}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Beklemede
                  </span>
                {:else}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Başarısız
                  </span>
                {/if}
              </div>
            </div>
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 truncate">
                {new Date(map.created_at).toLocaleDateString('tr-TR')}
              </h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500 truncate">
                {map.story_text.substring(0, 50)}...
              </p>
              <div class="mt-4 space-y-2">
                {#if map.payment_status === 'completed'}
                  <a href="/api/download/{map.id}" class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <Download class="h-4 w-4 mr-2" />
                    İndir (HD)
                  </a>
                {:else}
                  <a href="/preview/{map.id}" class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Önizle
                  </a>
                {/if}
                <div class="space-y-1">
                  <button on:click={() => shareMap(map)} class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <Share2 class="h-4 w-4 mr-2" />
                    Paylaş (Link)
                  </button>
                  {#if origin}
                    <div class="grid grid-cols-3 gap-2">
                      <a target="_blank" rel="noreferrer" class="inline-flex justify-center items-center px-2 py-2 text-xs font-medium rounded bg-[#111] text-white hover:opacity-90"
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${origin}/preview/${map.id}`)}`}>
                        X
                      </a>
                      <a target="_blank" rel="noreferrer" class="inline-flex justify-center items-center px-2 py-2 text-xs font-medium rounded bg-[#1877F2] text-white hover:opacity-90"
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${origin}/preview/${map.id}`)}`}>
                        FB
                      </a>
                      <a target="_blank" rel="noreferrer" class="inline-flex justify-center items-center px-2 py-2 text-xs font-medium rounded bg-[#25D366] text-white hover:opacity-90"
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${origin}/preview/${map.id}`)}`}>
                        WA
                      </a>
                    </div>
                  {/if}
                  {#if shareMessage}
                    <p class="text-xs text-green-600">{shareMessage}</p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
