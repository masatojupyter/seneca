import { getTranslations } from 'next-intl/server';
import { ROUTES } from '@/lib/client/routes';
import { InvitationForm, sendWorkerInvitationAction } from '@/lib/client/features/invitation';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default async function InviteWorkerPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('workers.invite');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN.WORKERS}
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm inline-block mb-2"
        >
          {t('backToList')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-600">
          {t('subtitle')}
        </p>
      </div>

      <Card>
        <div className="p-6">
          <InvitationForm onSubmit={sendWorkerInvitationAction} />
        </div>
      </Card>
    </div>
  );
}
