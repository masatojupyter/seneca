import { getTranslations } from 'next-intl/server';
import { getWorkersAction, WorkersPageTabs } from '@/lib/client/features/worker-management';
import { getInvitationsAction } from '@/lib/client/features/invitation';
import Link from 'next/link';
import { ROUTES } from '@/lib/client/routes';

export default async function WorkersPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('workers');
  const [workersResult, invitationsResult] = await Promise.all([
    getWorkersAction(),
    getInvitationsAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-gray-600">{t('subtitle')}</p>
        </div>
        <Link
          href={ROUTES.ADMIN.WORKERS_INVITE}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {t('inviteButton')}
        </Link>
      </div>

      {workersResult.success && workersResult.workers ? (
        <WorkersPageTabs
          workers={workersResult.workers}
          invitations={invitationsResult.success && invitationsResult.invitations ? invitationsResult.invitations : []}
        />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('getFailed')} {workersResult.error}
        </div>
      )}
    </div>
  );
}
