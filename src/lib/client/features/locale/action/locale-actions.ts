'use server';

import { cookies } from 'next/headers';

export type Locale = 'en-us' | 'ja-jp';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function setLocaleAction(locale: Locale): Promise<{ success: boolean }> {
  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return { success: true };
}

export async function getLocaleAction(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (locale === 'en-us' || locale === 'ja-jp') {
    return locale;
  }

  return 'ja-jp'; // Default locale
}
