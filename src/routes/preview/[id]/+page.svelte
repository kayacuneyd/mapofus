<script>
  import { CreditCard, Download, ArrowLeft } from 'lucide-svelte';
  
  export let data;
  let { map } = data;
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
                {#if map.payment_status === 'completed'}
                  <span class="text-green-600">Ödendi</span>
                {:else}
                  <span class="text-yellow-600">Ödeme Bekleniyor</span>
                {/if}
              </h4>
              
              {#if map.payment_status !== 'completed'}
                <p class="mt-2 text-sm text-gray-500">
                  Yüksek çözünürlüklü (1024x1024) versiyonu indirmek için ödeme yapınız.
                </p>
                <div class="mt-4">
                  <a href="https://ruul.io/pay/..." target="_blank" class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    <CreditCard class="h-5 w-5 mr-2" />
                    Satın Al (₺299)
                  </a>
                  <p class="mt-2 text-xs text-center text-gray-400">
                    Ödeme sonrası sayfa yenilenecektir.
                  </p>
                </div>
              {:else}
                <div class="mt-4">
                  <a href="/api/download/{map.id}" class="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    <Download class="h-5 w-5 mr-2" />
                    HD Versiyonu İndir
                  </a>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
