import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ROUTES } from '@/lib/client/routes';
import { LanguageSwitcher, type Locale } from '@/lib/client/features/locale';

export async function TopHeader(): Promise<React.JSX.Element> {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href={ROUTES.HOME}
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent"
        >
          Token Wage
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href={ROUTES.ADMIN_LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline"
          >
            {t('auth.login.loginAsAdmin')}
          </Link>
          <Link
            href={ROUTES.WORKER_LOGIN}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('auth.login.loginAsWorker')}
          </Link>
          <Link
            href={ROUTES.ADMIN_REGISTER}
            className="text-sm px-4 py-2 bg-gradient-to-r from-purple-600 to-green-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-200 transition-all"
          >
            {t('landingPage.hero.ctaStart')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
