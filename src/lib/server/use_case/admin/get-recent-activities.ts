import { prisma } from '@/lib/server/infra/prisma';
import { findApplicationsByOrganizationId } from '@/lib/server/repository/time-application-repository';

export type ActivityType = 'APPLICATION' | 'PAYMENT';

export type RecentActivity = {
  id: string;
  type: ActivityType;
  workerName: string;
  workerEmail: string;
  amount?: number;
  status: string;
  createdAt: Date;
};

/**
 * 最近の活動を取得（申請と支払いリクエスト）
 */
export async function getRecentActivities(
  organizationId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  // 最近の申請を取得（TimescaleDB）
  const recentApplications = await findApplicationsByOrganizationId(organizationId, { limit });

  // 最近の支払いリクエストを取得（PostgreSQL）
  const recentPayments = await prisma.paymentRequest.findMany({
    where: {
      worker: { organizationId },
    },
    include: {
      worker: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  // 申請の従業員情報を取得
  const workerIds = [...new Set(recentApplications.map(app => app.workerId))];
  const workers = await prisma.workerUser.findMany({
    where: { id: { in: workerIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  const workerMap = new Map(workers.map(w => [w.id, w]));

  // 活動をマージして時系列順にソート
  const activities: RecentActivity[] = [
    ...recentApplications.map((app) => {
      const worker = workerMap.get(app.workerId);
      return {
        id: app.id,
        type: 'APPLICATION' as ActivityType,
        workerName: worker?.name || 'Unknown',
        workerEmail: worker?.email || 'Unknown',
        amount: Number(app.totalAmountUsd),
        status: app.status,
        createdAt: app.createdAt,
      };
    }),
    ...recentPayments.map((payment) => ({
      id: payment.id,
      type: 'PAYMENT' as ActivityType,
      workerName: payment.worker.name,
      workerEmail: payment.worker.email,
      amount: Number(payment.amountUsd),
      status: payment.status,
      createdAt: payment.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, limit);
}
