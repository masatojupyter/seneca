import { getTranslations } from 'next-intl/server';
import {
  getCryptoSettingAction,
  CryptoSettingsForm,
  OrganizationWalletSection,
  TokenIssuerConfigSection,
  WalletConnectionSection,
} from '@/lib/client/features/crypto-settings';

export default async function CryptoSettingsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('cryptoSettings');
  const result = await getCryptoSettingAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-600">{t('subtitle')}</p>
      </div>

      <WalletConnectionSection />

      <OrganizationWalletSection />

      <TokenIssuerConfigSection />

      {result.success ? (
        <CryptoSettingsForm setting={result.data ?? null} />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('getFailed')} {result.error}
        </div>
      )}
    </div>
  );
}
