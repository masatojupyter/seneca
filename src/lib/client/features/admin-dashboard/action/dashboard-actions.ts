'use server';

import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getDashboardStats } from '@/lib/server/use_case/admin/get-dashboard-stats';
import { getRecentActivities } from '@/lib/server/use_case/admin/get-recent-activities';

export type DashboardStatsResult = {
  success: boolean;
  error?: string;
  stats?: {
    totalWorkers: number;
    activeWorkers: number;
    pendingApplications: number;
    pendingPayments: number;
    totalApplicationsThisMonth: number;
    totalPaymentsThisMonth: number;
    totalAmountPaidThisMonth: number;
  };
};

export type ActivityItem = {
  id: string;
  type: 'APPLICATION' | 'PAYMENT';
  workerName: string;
  workerEmail: string;
  amount?: number;
  status: string;
  createdAt: string;
};

export type RecentActivitiesResult = {
  success: boolean;
  error?: string;
  activities?: ActivityItem[];
};

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStatsAction(): Promise<DashboardStatsResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const stats = await getDashboardStats(session.user.organizationId);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get dashboard stats error:', error);
    return {
      success: false,
      error: '統計の取得に失敗しました',
    };
  }
}

/**
 * 最近の活動を取得
 */
export async function getRecentActivitiesAction(): Promise<RecentActivitiesResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const activities = await getRecentActivities(session.user.organizationId);

    return {
      success: true,
      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        workerName: activity.workerName,
        workerEmail: activity.workerEmail,
        amount: activity.amount,
        status: activity.status,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get recent activities error:', error);
    return {
      success: false,
      error: '活動履歴の取得に失敗しました',
    };
  }
}
