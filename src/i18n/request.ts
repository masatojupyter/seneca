import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

type Locale = 'en-us' | 'ja-jp';
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE: Locale = 'en-us';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  const locale: Locale =
    cookieLocale === 'en-us' || cookieLocale === 'ja-jp'
      ? cookieLocale
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});