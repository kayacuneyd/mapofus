<script>
  import { CreditCard, Download, ArrowLeft, Share2 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';

  export let data;
  let { map, settings } = data;
  let ruulPaymentLink = settings?.ruul_payment_link || '';

  let shareMessage = '';
  let origin = '';
  let invoiceNumber = '';
  let invoiceError = '';
  let isSubmitting = false;

  onMount(() => {
    origin = window.location.origin;
  });

  async function shareMap() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
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

  async function submitInvoice() {
    invoiceError = '';
    isSubmitting = true;

    try {
      const response = await fetch(`/api/maps/${map.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_number: invoiceNumber })
      });

      const result = await response.json();

      if (!response.ok) {
        invoiceError = result.error || 'Fatura gönderilemedi';
        return;
      }

      // Refresh page data
      await invalidate(`/preview/${map.id}`);

      // Reset form
      invoiceNumber = '';

    } catch (err) {
      console.error('Invoice submission error:', err);
      invoiceError = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <div class="px-4 py-6 sm:px-0">
    <div class="mb-6">
      <a href="/dashboard" class="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft class="h-4 w-4 mr-1" />
        Dashboard'a Dön
      </a>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          Harita Önizlemesi
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          {new Date(map.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu.
        </p>
      </div>
      <div class="border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <img src={map.thumbnail_url} alt="Map Preview" class="w-full rounded-lg shadow-lg" />
          </div>
          <div class="flex flex-col justify-center space-y-6">
            <div>
              <h4 class="text-lg font-medium text-gray-900">Hikayeniz</h4>
              <p class="mt-2 text-gray-600 text-sm">
                {map.story_text}
              </p>
            </div>

            <div class="bg-gray-50 p-4 rounded-md">
              <h4 class="text-lg font-medium text-gray-900">Durum:
                {#if map.order_status === 'pending'}
                  <span class="text-yellow-600">Ödeme Bekleniyor</span>
                {:else if map.order_status === 'invoice_submitted'}
                  <span class="text-blue-600">Fatura Alındı</span>
                {:else if map.order_status === 'payment_verifying'}
                  <span class="text-yellow-600">İnceleniyor</span>
                {:else if map.order_status === 'payment_rejected'}
                  <span class="text-red-600">Ödeme Reddedildi</span>
                {:else if ['payment_confirmed', 'ready_for_download', 'completed'].includes(map.order_status) || map.payment_status === 'completed'}
                  <span class="text-green-600">Ödendi</span>
                {:else}
                  <span class="text-yellow-600">Ödeme Bekleniyor</span>
                {/if}
              </h4>

              {#if map.order_status === 'pending' || (!map.order_status && map.payment_status !== 'completed')}
                <p class="mt-2 text-sm text-gray-500">
                  Yüksek çözünürlüklü (1024x1024) versiyonu indirmek için ödeme yapınız.
                </p>

                <!-- Ödeme Talimatları -->
                <div class="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h5 class="text-sm font-medium text-blue-900 mb-2">Ödeme Talimatları:</h5>
                  <ol class="text-xs text-blue-800 list-decimal list-inside space-y-1">
                    <li>$3 ödeyin</li>
                    <li>Ödeme sonrası fatura/dekont numaranızı aşağıdaki forma girin</li>
                    <li>Ödeme onaylandıktan sonra indirme aktif olacak</li>
                  </ol>
                </div>

                <!-- Ruul.io Ödeme Butonu -->
                {#if ruulPaymentLink}
                  <div class="mt-4">
                    <a
                      href={ruulPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                    >
                      <CreditCard class="h-5 w-5 mr-2" />
                      Ruul.io Ödeme
                    </a>
                  </div>
                {:else}
                  <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-800">
                    Ödeme linki henüz tanımlı değil. Lütfen destek ile iletişime geçin.
                  </div>
                {/if}

                <!-- Fatura Numarası Formu -->
                <form on:submit|preventDefault={submitInvoice} class="mt-4 space-y-2">
                  <div>
                    <label for="invoice" class="block text-sm font-medium text-gray-700">
                      Fatura/Dekont Numarası
                    </label>
                    <input
                      type="text"
                      id="invoice"
                      bind:value={invoiceNumber}
                      placeholder="Örn: INV-2024-001234"
                      required
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {#if invoiceError}
                    <p class="text-sm text-red-600">{invoiceError}</p>
                  {/if}

                  <button
                    type="submit"
                    disabled={isSubmitting || !invoiceNumber.trim()}
                    class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {#if isSubmitting}
                      Gönderiliyor...
                    {:else}
                      <CreditCard class="h-5 w-5 mr-2" />
                      Fatura Numarasını Gönder
                    {/if}
                  </button>
                </form>

              {:else if map.order_status === 'invoice_submitted'}
                <p class="mt-2 text-sm text-blue-600">
                  Fatura numaranız alındı: <strong>{map.invoice_number}</strong>
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Ödemeniz doğrulanıyor. Lütfen bekleyiniz.
                </p>

              {:else if map.order_status === 'payment_verifying'}
                <p class="mt-2 text-sm text-yellow-600">
                  Ödemeniz inceleniyor. Kısa süre içinde onaylanacak.
                </p>
                {#if map.invoice_number}
                  <p class="text-xs text-gray-500 mt-1">
                    Fatura No: {map.invoice_number}
                  </p>
                {/if}

              {:else if map.order_status === 'payment_rejected'}
                <p class="mt-2 text-sm text-red-600">
                  Ödeme doğrulanamadı. Lütfen destek ile iletişime geçin.
                </p>
                {#if map.admin_notes}
                  <div class="mt-2 bg-red-50 border border-red-200 rounded-md p-2">
                    <p class="text-xs text-red-800"><strong>Not:</strong> {map.admin_notes}</p>
                  </div>
                {/if}

              {:else if ['payment_confirmed', 'ready_for_download', 'completed'].includes(map.order_status) || map.payment_status === 'completed'}
                <p class="mt-2 text-sm text-green-600">
                  Ödemeniz onaylandı!
                </p>
                <div class="mt-4">
                  <a href="/api/download/{map.id}" class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    <Download class="h-5 w-5 mr-2" />
                    HD Versiyonu İndir
                  </a>
                </div>
              {/if}
              <div class="mt-3">
                <button on:click={shareMap} class="w-full flex justify-center items-center px-4 py-3 border border-gray-200 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <Share2 class="h-5 w-5 mr-2" />
                  Paylaş (Link)
                </button>
                {#if origin}
                  <div class="mt-2 grid grid-cols-3 gap-2">
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
                  <p class="mt-2 text-xs text-green-600 text-center">{shareMessage}</p>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
