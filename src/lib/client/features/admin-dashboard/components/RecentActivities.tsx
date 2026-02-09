'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

type Activity = {
  id: string;
  type: 'APPLICATION' | 'PAYMENT';
  workerName: string;
  workerEmail: string;
  amount?: number;
  status: string;
  createdAt: string;
};

type RecentActivitiesProps = {
  activities: Activity[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REQUESTED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-purple-100 text-purple-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const t = useTranslations();

  const statusLabels = useMemo(() => ({
    PENDING: t('applications.status.pending'),
    APPROVED: t('applications.status.approved'),
    REJECTED: t('applications.status.rejected'),
    REQUESTED: t('applications.status.paymentRequested'),
    PAID: t('applications.status.paid'),
    PROCESSING: t('payments.status.processing'),
    COMPLETED: t('payments.status.completed'),
    FAILED: t('payments.status.failed'),
  }), [t]);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('admin.recentActivities.title')}</h2>

        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('admin.recentActivities.empty')}</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {activity.type === 'APPLICATION' ? t('admin.recentActivities.application') : t('admin.recentActivities.payment')}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        STATUS_COLORS[activity.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[activity.status as keyof typeof statusLabels] || activity.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {activity.workerName} ({activity.workerEmail})
                  </div>
                  {activity.amount !== undefined && (
                    <div className="text-sm font-semibold text-gray-900 mt-1">
                      ${Number(activity.amount).toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                  <Link
                    href={
                      activity.type === 'APPLICATION'
                        ? `/admin/dashboard/applications/${activity.id}`
                        : `/admin/payments/${activity.id}`
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {t('common.details')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
