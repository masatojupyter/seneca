import { getTranslations } from 'next-intl/server';
import {
  OrganizationWalletSection,
  TokenIssuerConfigSection,
  WalletConnectionSection,
} from '@/lib/client/features/crypto-settings';

export default async function CryptoSettingsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('cryptoSettings');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-600">{t('subtitle')}</p>
      </div>

      <WalletConnectionSection />

      <TokenIssuerConfigSection />

      <OrganizationWalletSection />
    </div>
  );
}
