<script>
  import { ArrowLeft, Share2, UserPlus } from 'lucide-svelte';
  import { onMount } from 'svelte';

  export let data;
  let { map } = data;
  let shareMessage = '';
  let origin = '';

  const createdDate = map.created_at
    ? new Date(map.created_at).toLocaleDateString('tr-TR')
    : '';

  onMount(() => {
    origin = window.location.origin;
  });

  async function shareLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Map of Us',
          text: 'Özel harita önizlemesi',
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

  const statusLabel = (() => {
    const s = map.order_status || map.payment_status || 'pending';
    const labels = {
      pending: 'Ödeme Bekleniyor',
      invoice_submitted: 'Fatura Alındı',
      payment_verifying: 'Doğrulama',
      payment_rejected: 'Reddedildi',
      payment_confirmed: 'Ödendi',
      ready_for_download: 'İndirilebilir',
      completed: 'Tamamlandı'
    };
    return labels[s] || 'Beklemede';
  })();
</script>

<svelte:head>
  <title>Map of Us | Public Preview</title>
  <meta name="description" content="AI ile üretilmiş kişiye özel harita önizlemesi." />
  {#if map.thumbnail_url}
    <meta property="og:image" content={map.thumbnail_url} />
  {/if}
  <meta property="og:title" content="Map of Us | Public Preview" />
  <meta property="og:description" content="AI ile üretilmiş kişiye özel harita önizlemesi." />
</svelte:head>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="mb-6 flex items-center gap-3">
      <a href="/" class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft class="h-4 w-4 mr-1" />
        Ana Sayfa
      </a>
      {#if origin}
        <button
          on:click={shareLink}
          class="ml-auto inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <Share2 class="h-4 w-4 mr-2" />
          Paylaş
        </button>
      {/if}
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Harita Önizlemesi (Public)
          </h3>
          {#if createdDate}
            <p class="mt-1 text-sm text-gray-500">
              {createdDate} tarihinde oluşturuldu.
            </p>
          {/if}
        </div>
        <a
          href="/auth/register"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus class="h-4 w-4 mr-2" />
          Kendi haritanızı oluşturun
        </a>
      </div>
      <div class="border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div class="flex justify-center">
            {#if map.thumbnail_url}
              <img src={map.thumbnail_url} alt="Map Preview" class="w-full rounded-lg shadow-lg" />
            {:else}
              <div class="w-full h-64 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-400">
                Önizleme yok
              </div>
            {/if}
          </div>
          <div class="flex flex-col justify-center space-y-6">
            <div>
              <h4 class="text-lg font-medium text-gray-900">Hikaye Özeti</h4>
              <p class="mt-2 text-gray-600 text-sm whitespace-pre-wrap">
                {map.story_text}
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-md">
              <h4 class="text-lg font-medium text-gray-900">Durum:
                <span class="text-indigo-600">{statusLabel}</span>
              </h4>
              <p class="mt-2 text-sm text-gray-500">
                Bu sayfa herkese açık önizlemedir. HD indirme ve ödeme adımları için giriş yapıp ilgili map sahibinin paneline erişmeniz gerekir.
              </p>
            </div>

            <div class="space-y-2">
              <a
                href="/auth/register"
                class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Hemen Başla
              </a>
              <a
                href="/auth/login"
                class="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Giriş Yap
              </a>
              {#if shareMessage}
                <p class="text-xs text-green-600 text-center mt-1">{shareMessage}</p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
