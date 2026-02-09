import { getLocale, getTranslations } from 'next-intl/server';
import {
  getApplicationDetailAction,
  ApprovalActions,
} from '@/lib/client/features/application-approval';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ROUTES } from '@/lib/client/routes';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('applications.status.pending'),
    APPROVED: t('applications.status.approved'),
    REJECTED: t('applications.status.rejected'),
  };

  const TYPE_LABELS: Record<string, string> = {
    SINGLE: t('applications.types.single'),
    BATCH: t('applications.types.batch'),
    PERIOD: t('applications.types.period'),
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  const result = await getApplicationDetailAction(id);

  if (!result.success || !result.application) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {result.error || t('applications.detail.notFound')}
      </div>
    );
  }

  const app = result.application;
  const totalHours = Math.floor(app.totalMinutes / 60);
  const remainingMinutes = app.totalMinutes % 60;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN.APPLICATIONS}
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm inline-block mb-2"
        >
          {t('applications.detail.backToList')}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('applications.detail.title')}</h1>
          <span
            className={`px-3 py-1 text-sm rounded-full ${
              STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[app.status] || app.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('applications.detail.applicationInfo')}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('common.worker')}</dt>
                  <dd className="text-lg font-semibold mt-1">{app.workerName}</dd>
                  <dd className="text-sm text-gray-500">{app.workerEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.applicationType')}</dt>
                  <dd className="text-sm mt-1">{TYPE_LABELS[app.type] || app.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.targetPeriod')}</dt>
                  <dd className="text-sm mt-1">
                    {formatDate(app.startDate)} 〜 {formatDate(app.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.workHours')}</dt>
                  <dd className="text-2xl font-bold mt-1 text-blue-600">
                    {totalHours}{t('common.hours')}{remainingMinutes}{t('common.minutes')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.hourlyRate')}</dt>
                  <dd className="text-lg font-semibold mt-1">
                    ${app.workerHourlyRate.toFixed(2)} / {t('common.hours')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.salary')}</dt>
                  <dd className="text-3xl font-bold mt-1 text-green-600">
                    ${app.totalAmountUsd.toFixed(2)}
                  </dd>
                </div>
                {app.memo && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t('common.memo')}</dt>
                    <dd className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">{app.memo}</dd>
                  </div>
                )}
                {app.rejectionReason && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t('applications.detail.rejectionReason')}</dt>
                    <dd className="text-sm mt-1 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      {app.rejectionReason}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('applications.detail.applicationDate')}</dt>
                  <dd className="text-sm mt-1">
                    {formatDateTime(app.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('applications.detail.timestampDetails')}</h2>
              <div className="space-y-2">
                {app.timestamps.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium">{ts.status}</div>
                      {ts.memo && <div className="text-xs text-gray-500 mt-1">{ts.memo}</div>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(ts.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('applications.detail.approvalActions')}</h2>
              <ApprovalActions
                applicationId={app.id}
                status={app.status}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
