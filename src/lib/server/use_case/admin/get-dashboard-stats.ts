import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';

export type DashboardStats = {
  totalWorkers: number;
  activeWorkers: number;
  pendingApplications: number;
  pendingPayments: number;
  totalApplicationsThisMonth: number;
  totalPaymentsThisMonth: number;
  totalAmountPaidThisMonth: number;
};

/**
 * 管理者ダッシュボードの統計情報を取得
 */
export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // 並列で統計情報を取得
  const [
    totalWorkers,
    activeWorkers,
    pendingApplicationsResult,
    pendingPayments,
    totalApplicationsThisMonthResult,
    paymentsThisMonth,
  ] = await Promise.all([
    // 総従業員数
    prisma.workerUser.count({
      where: { organizationId },
    }),

    // アクティブな従業員数
    prisma.workerUser.count({
      where: { organizationId, isActive: true },
    }),

    // 承認待ち申請数（TimescaleDB）
    queryTimescale<{ count: string }>(
      `SELECT COUNT(*) as count FROM time_applications
       WHERE organization_id = $1 AND status = 'PENDING'`,
      [organizationId]
    ),

    // 支払い待ちリクエスト数
    prisma.paymentRequest.count({
      where: {
        worker: { organizationId },
        status: 'PENDING',
      },
    }),

    // 今月の申請数（TimescaleDB）
    queryTimescale<{ count: string }>(
      `SELECT COUNT(*) as count FROM time_applications
       WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [organizationId, firstDayOfMonth, lastDayOfMonth]
    ),

    // 今月の支払い
    prisma.paymentRequest.findMany({
      where: {
        worker: { organizationId },
        status: 'COMPLETED',
        processedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      select: {
        amountUsd: true,
      },
    }),
  ]);

  // 今月の支払い総額を計算
  const totalAmountPaidThisMonth = paymentsThisMonth.reduce(
    (sum, payment) => sum + Number(payment.amountUsd),
    0
  );

  return {
    totalWorkers,
    activeWorkers,
    pendingApplications: parseInt(pendingApplicationsResult[0]?.count || '0', 10),
    pendingPayments,
    totalApplicationsThisMonth: parseInt(totalApplicationsThisMonthResult[0]?.count || '0', 10),
    totalPaymentsThisMonth: paymentsThisMonth.length,
    totalAmountPaidThisMonth,
  };
}
