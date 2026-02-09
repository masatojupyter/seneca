import { getTranslations } from 'next-intl/server';
import {
  getOrganizationAction,
  OrganizationSettingsForm,
} from '@/lib/client/features/organization-settings';

export default async function OrganizationSettingsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('organizationSettings');
  const result = await getOrganizationAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-600">{t('subtitle')}</p>
      </div>

      {result.success && result.data ? (
        <OrganizationSettingsForm organization={result.data} />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('getFailed')} {result.error}
        </div>
      )}
    </div>
  );
}
