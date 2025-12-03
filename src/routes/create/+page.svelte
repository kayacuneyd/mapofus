<script>
  import { goto } from '$app/navigation';
  
  let loading = false;
  let error = null;
  let aspectRatio = '16:9';
  let qaAnswers = [
    { question: 'Oluşturduğunuz bu görseldeki kişi/lerle ilk nerede buluşturunuz?', answer: '' },
    { question: 'Bu kişi/lerle olan yakınlık dereceniz nedir?', answer: '' },
    { question: 'Kişi/lerle yaptığınız ilk tatil nerede gerçekleşti?', answer: '' },
    { question: 'İlk tanışma noktanız neresiydi?', answer: '' },
    { question: 'Birlikte en çok hatırladığınız yürüyüş veya yolculuk nerede?', answer: '' },
    { question: 'Sizin için özel olan tarih veya etkinlik nedir?', answer: '' }
  ];
  const MAX_QA = 10;
  
  async function handleSubmit(event) {
    loading = true;
    error = null;
    
    const formData = new FormData(event.target);
    const answeredQa = qaAnswers
      .filter((item) => item.answer && item.answer.trim().length > 0)
      .map((item) => ({
        question: item.question,
        answer: item.answer.trim()
      }));

    const data = {
      story_text: formData.get('story_text'),
      start_date: formData.get('start_date') || undefined,
      theme: formData.get('theme') || undefined,
      locations: formData.get('locations') || undefined,
      aspect_ratio: aspectRatio || undefined,
      coupon_code: formData.get('coupon_code') || undefined,
      qa_answers: answeredQa.length ? answeredQa : undefined
    };
    
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

  function addQuestion() {
    if (qaAnswers.length >= MAX_QA) return;
    qaAnswers = [
      ...qaAnswers,
      {
        question: 'Haritanızda görünmesini istediğiniz başka kısa bir anınız var mı?',
        answer: ''
      }
    ];
  }

  function removeQuestion(index) {
    if (qaAnswers.length <= 6) return;
    qaAnswers = qaAnswers.filter((_, idx) => idx !== index);
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
              Hikayeniz (en az 120 karakter)
            </label>
            <div class="mt-1">
              <textarea
                id="story_text"
                name="story_text"
                rows="8"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="İlişkiniz nasıl başladı? En güzel anılarınız neler? Kısa bir paragraf yeterli."
                required
                minlength="120"
              ></textarea>
            </div>
            <p class="mt-2 text-sm text-gray-500">Detaylı bir hikaye daha iyi bir harita sağlar; en az 120 karakter.</p>
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

          <div class="sm:col-span-3">
            <label for="aspect_ratio" class="block text-sm font-medium text-gray-700">
              Görsel Oranı
            </label>
            <div class="mt-1">
              <select
                id="aspect_ratio"
                name="aspect_ratio"
                bind:value={aspectRatio}
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="16:9">16:9 (yatay)</option>
                <option value="9:16">9:16 (dikey)</option>
                <option value="1:1">1:1 (kare)</option>
              </select>
            </div>
            <p class="mt-1 text-xs text-gray-500">Harita, seçtiğiniz orana göre dengeli yerleşecek.</p>
          </div>

          <div class="sm:col-span-6">
            <label for="locations" class="block text-sm font-medium text-gray-700">
              Önemli Lokasyonlar
            </label>
            <div class="mt-1">
              <input type="text" name="locations" id="locations" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="İstanbul, Paris, Kapadokya (Virgülle ayırın)">
            </div>
          </div>

          <div class="sm:col-span-6">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-gray-700">Rehber Sorular (6-10 adet)</label>
              <button
                type="button"
                class="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                on:click={addQuestion}
                disabled={qaAnswers.length >= MAX_QA}
              >
                Soru Ekle
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-500">
              Sorular pasif üslupta; sadece cevaplayın. Boş bıraktıklarınız gönderilmez.
            </p>
            <div class="mt-4 space-y-4">
              {#each qaAnswers as qa, index}
                <div class="border border-gray-200 rounded-md p-3">
                  <div class="flex items-start justify-between">
                    <p class="text-sm font-medium text-gray-800 pr-4">{qa.question}</p>
                    {#if qaAnswers.length > 6}
                      <button
                        type="button"
                        class="text-xs text-gray-500 hover:text-gray-700"
                        on:click={() => removeQuestion(index)}
                      >
                        Kaldır
                      </button>
                    {/if}
                  </div>
                  <div class="mt-2">
                    <textarea
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      rows="2"
                      bind:value={qaAnswers[index].answer}
                      placeholder="Kısa ve net cevap yazın (maks. 180 karakter önerilir)"
                    ></textarea>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="coupon_code" class="block text-sm font-medium text-gray-700">
              Kupon Kodu (isteğe bağlı)
            </label>
            <div class="mt-1">
              <input type="text" name="coupon_code" id="coupon_code" maxlength="100" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="KUPON2024">
            </div>
            <p class="mt-1 text-xs text-gray-500">Geçerli kupon kodu varsa indirim uygulanır.</p>
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
