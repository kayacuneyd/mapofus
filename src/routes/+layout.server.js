import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '$lib/i18n/translations';

export const load = async ({ locals: { getSession }, cookies }) => {
  const cookieLocale = cookies.get('locale');
  const locale = SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    session: await getSession(),
    locale
  };
};
