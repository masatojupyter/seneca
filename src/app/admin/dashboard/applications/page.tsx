import { getTranslations } from 'next-intl/server';
import { getApplicationsAction, ApplicationTable } from '@/lib/client/features/application-approval';

export default async function ApplicationsPage(): Promise<React.JSX.Element> {
  const t = await getTranslations();
  const result = await getApplicationsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('applications.title')}</h1>
        <p className="mt-1 text-gray-600">{t('applications.subtitle')}</p>
      </div>

      {result.success && result.applications ? (
        <ApplicationTable applications={result.applications} />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('applications.getFailed')} {result.error}
        </div>
      )}
    </div>
  );
}
