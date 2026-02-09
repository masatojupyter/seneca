'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';

type StatsCardsProps = {
  stats: {
    totalWorkers: number;
    activeWorkers: number;
    pendingApplications: number;
    pendingPayments: number;
    totalApplicationsThisMonth: number;
    totalPaymentsThisMonth: number;
    totalAmountPaidThisMonth: number;
  };
};

export function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('admin.stats');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('totalWorkers')}</div>
          <div className="mt-2 text-3xl font-bold">{stats.totalWorkers}</div>
          <div className="mt-1 text-sm text-gray-500">
            {t('activeWorkers', { count: stats.activeWorkers })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('pendingApplications')}</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {stats.pendingApplications}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {t('applicationsThisMonth', { count: stats.totalApplicationsThisMonth })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('pendingPayments')}</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.pendingPayments}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            {t('paymentsThisMonth', { count: stats.totalPaymentsThisMonth })}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('totalPaymentsThisMonth')}</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            ${stats.totalAmountPaidThisMonth.toFixed(2)}
          </div>
          <div className="mt-1 text-sm text-gray-500">USD</div>
        </div>
      </Card>
    </div>
  );
}
