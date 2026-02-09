import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';

export type WorkerDetail = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalApplications: number;
    approvedApplications: number;
    pendingApplications: number;
    totalPayments: number;
    totalAmountPaid: number;
  };
};

/**
 * 従業員の詳細情報を取得
 */
export async function getWorkerDetail(
  workerId: string,
  organizationId: string
): Promise<WorkerDetail | null> {
  const worker = await prisma.workerUser.findFirst({
    where: {
      id: workerId,
      organizationId,
    },
  });

  if (!worker) {
    return null;
  }

  // 統計情報を並列で取得
  const [applicationStats, payments] = await Promise.all([
    // 申請統計（TimescaleDB）
    queryTimescale<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM time_applications
       WHERE worker_id = $1
       GROUP BY status`,
      [workerId]
    ),

    // 支払い済みリクエスト（PostgreSQL）
    prisma.paymentRequest.findMany({
      where: {
        workerId,
        status: 'COMPLETED',
      },
      select: {
        amountUsd: true,
      },
    }),
  ]);

  // 申請統計を集計
  let totalApplications = 0;
  let approvedApplications = 0;
  let pendingApplications = 0;

  for (const stat of applicationStats) {
    const count = parseInt(stat.count, 10);
    totalApplications += count;
    if (stat.status === 'APPROVED' || stat.status === 'REQUESTED' || stat.status === 'PAID') {
      approvedApplications += count;
    } else if (stat.status === 'PENDING') {
      pendingApplications = count;
    }
  }

  const totalAmountPaid = payments.reduce((sum, payment) => sum + Number(payment.amountUsd), 0);

  return {
    id: worker.id,
    name: worker.name,
    email: worker.email,
    hourlyRateUsd: Number(worker.hourlyRateUsd),
    isActive: worker.isActive,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
    stats: {
      totalApplications,
      approvedApplications,
      pendingApplications,
      totalPayments: payments.length,
      totalAmountPaid,
    },
  };
}
