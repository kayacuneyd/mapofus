<script>
  import { ArrowRight, Heart, Map, ShieldCheck } from 'lucide-svelte';
  import { t } from '$lib/i18n/i18n';
  
  export let data;
  const PAYMENT_URL = 'https://ruul.space/cuneytkaya/products/13347';
  const steps = [
    {
      icon: Heart,
      titleKey: 'steps.items.0.title',
      descKey: 'steps.items.0.desc'
    },
    {
      icon: Map,
      titleKey: 'steps.items.1.title',
      descKey: 'steps.items.1.desc'
    },
    {
      icon: ShieldCheck,
      titleKey: 'steps.items.2.title',
      descKey: 'steps.items.2.desc'
    },
    {
      icon: ArrowRight,
      titleKey: 'steps.items.3.title',
      descKey: 'steps.items.3.desc'
    }
  ];

  const isAuthed = !!data?.session;
</script>

<div class="bg-white">
  <!-- Hero Section -->
  <div class="relative overflow-hidden">
    <div class="max-w-7xl mx-auto">
      <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
        <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
          <div class="sm:text-center lg:text-left">
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block xl:inline">{$t('hero.title1')}</span>
              <span class="block text-indigo-600 xl:inline">{$t('hero.title2')}</span>
            </h1>
            <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              {$t('hero.subtitle')}
            </p>
            <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-3 flex-wrap">
              {#if isAuthed}
                <div class="rounded-md shadow">
                  <a href={PAYMENT_URL} target="_blank" rel="noopener noreferrer" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10">
                    {$t('hero.ctaPurchase')}
                  </a>
                </div>
              {/if}
              <div class="rounded-md shadow">
                <a href="/auth/register" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                  {$t('hero.ctaStart')}
                </a>
              </div>
              <div>
                <a href="#how-it-works" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                  {$t('hero.ctaHow')}
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
      <img class="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=80" alt="Couple looking at map">
    </div>
  </div>

  <!-- Features Section -->
  <div id="how-it-works" class="py-12 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:text-center">
        <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">{$t('steps.heading')}</h2>
        <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {$t('steps.title')}
        </p>
      </div>

      <div class="mt-10">
        <dl class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
          {#each steps as step}
            <div class="relative">
              <dt>
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svelte:component this={step.icon} class="h-6 w-6" />
                </div>
                <p class="ml-16 text-lg leading-6 font-medium text-gray-900">{$t(step.titleKey)}</p>
              </dt>
              <dd class="mt-2 ml-16 text-base text-gray-500">
                {$t(step.descKey)}
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    </div>
  </div>

  <!-- Pricing -->
  <div class="bg-indigo-800">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
          {$t('pricing.title')}
        </h2>
        <p class="mt-3 text-xl text-indigo-200 sm:mt-4">
          {$t('pricing.subtitle')}
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {#if isAuthed}
            <a href={PAYMENT_URL} target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-lg">
              {$t('pricing.ctaPurchase')}
            </a>
          {/if}
          <a href="/auth/register" class="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50">
            {$t('pricing.ctaStart')}
          </a>
          {#if !isAuthed}
            <p class="text-xs text-indigo-100 sm:ml-3 sm:text-left text-center">
              Log in or sign up to unlock the purchase button.
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
