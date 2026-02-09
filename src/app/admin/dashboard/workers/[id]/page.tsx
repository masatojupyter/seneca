import { getLocale, getTranslations } from 'next-intl/server';
import { getWorkerDetailAction, EditWorkerForm } from '@/lib/client/features/worker-management';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ROUTES } from '@/lib/client/routes';

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();
  const result = await getWorkerDetailAction(id);

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  if (!result.success || !result.worker) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {result.error || t('workers.detail.notFound')}
      </div>
    );
  }

  const worker = result.worker;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN.WORKERS}
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm inline-block mb-2"
        >
          {t('workers.detail.backToList')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
        <p className="mt-1 text-gray-600">{worker.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('workers.detail.statistics')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">{t('workers.detail.totalApplications')}</div>
                  <div className="text-2xl font-bold mt-1">{worker.stats.totalApplications}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('workers.detail.approvedApplications')}</div>
                  <div className="text-2xl font-bold mt-1 text-green-600">
                    {worker.stats.approvedApplications}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('workers.detail.pendingApplications')}</div>
                  <div className="text-2xl font-bold mt-1 text-orange-600">
                    {worker.stats.pendingApplications}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('workers.detail.paymentCount')}</div>
                  <div className="text-2xl font-bold mt-1">{worker.stats.totalPayments}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">{t('workers.detail.totalPayments')}</div>
                  <div className="text-2xl font-bold mt-1 text-blue-600">
                    ${worker.stats.totalAmountPaid.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('workers.detail.basicInfo')}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('workers.detail.hourlyRate')}</dt>
                  <dd className="text-lg font-semibold mt-1">
                    ${worker.hourlyRateUsd.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('common.status')}</dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-sm rounded-full ${
                        worker.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {worker.isActive ? t('common.active') : t('common.inactive')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('workers.detail.registeredDate')}</dt>
                  <dd className="text-sm mt-1">
                    {formatDateTime(worker.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('workers.detail.lastUpdated')}</dt>
                  <dd className="text-sm mt-1">
                    {formatDateTime(worker.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('workers.detail.editSettings')}</h2>
              <EditWorkerForm worker={worker} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
