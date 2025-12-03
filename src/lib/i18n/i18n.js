import { writable, derived } from 'svelte/store';
import { translations, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './translations';

const localeStore = writable(DEFAULT_LOCALE);

export const locale = {
  subscribe: localeStore.subscribe,
  set: (value) => {
    const next = SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
    localeStore.set(next);
    if (typeof document !== 'undefined') {
      document.cookie = `locale=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
    }
  }
};

export const t = derived(localeStore, ($locale) => {
  return (key) => {
    const parts = key.split('.');
    let value = translations[$locale] || translations[DEFAULT_LOCALE];
    for (const part of parts) {
      value = value?.[part];
    }
    if (value === undefined) {
      // Fallback to default locale
      value = translations[DEFAULT_LOCALE];
      for (const part of parts) {
        value = value?.[part];
      }
    }
    return value ?? key;
  };
});

export const availableLocales = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'de', label: 'Deutsch' }
];
