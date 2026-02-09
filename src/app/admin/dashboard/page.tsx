import { getTranslations } from 'next-intl/server';
import {
  getDashboardStatsAction,
  getRecentActivitiesAction,
  StatsCards,
  RecentActivities,
} from '@/lib/client/features/admin-dashboard';

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('admin.dashboard');
  const [statsResult, activitiesResult] = await Promise.all([
    getDashboardStatsAction(),
    getRecentActivitiesAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-gray-600">{t('subtitle')}</p>
      </div>

      {statsResult.success && statsResult.stats ? (
        <StatsCards stats={statsResult.stats} />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('statsError')} {statsResult.error}
        </div>
      )}

      {activitiesResult.success && activitiesResult.activities ? (
        <RecentActivities activities={activitiesResult.activities} />
      ) : (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {t('activityError')} {activitiesResult.error}
        </div>
      )}
    </div>
  );
}
