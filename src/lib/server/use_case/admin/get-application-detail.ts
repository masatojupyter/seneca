import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import { findApplicationById } from '@/lib/server/repository/time-application-repository';

export type ApplicationDetail = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  workerHourlyRate: number;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  rejectionReason: string | null;
  timestampIds: string[];
  timestamps: Array<{
    id: string;
    status: string;
    timestamp: Date;
    memo: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 申請の詳細情報を取得
 */
export async function getApplicationDetail(
  applicationId: string,
  organizationId: string
): Promise<ApplicationDetail | null> {
  // TimescaleDBから申請を取得
  const application = await findApplicationById(applicationId);

  if (!application) {
    return null;
  }

  // 組織チェック
  if (application.organizationId !== organizationId) {
    return null;
  }

  // 従業員情報を取得
  const worker = await prisma.workerUser.findUnique({
    where: { id: application.workerId },
    select: {
      name: true,
      email: true,
      hourlyRateUsd: true,
    },
  });

  if (!worker) {
    return null;
  }

  // TimescaleDBから打刻データを取得
  const timestamps = await queryTimescale<{
    id: string;
    status: string;
    timestamp: Date;
    memo: string | null;
  }>(
    `SELECT id, status, timestamp, memo
     FROM work_timestamps
     WHERE id = ANY($1)
     ORDER BY timestamp ASC`,
    [application.timestampIds]
  );

  return {
    id: application.id,
    workerId: application.workerId,
    workerName: worker.name,
    workerEmail: worker.email,
    workerHourlyRate: Number(worker.hourlyRateUsd),
    type: application.type,
    startDate: application.startDate,
    endDate: application.endDate,
    totalMinutes: Number(application.totalMinutes),
    totalAmountUsd: Number(application.totalAmountUsd),
    status: application.status,
    memo: application.memo,
    rejectionReason: application.rejectionReason,
    timestampIds: application.timestampIds,
    timestamps: timestamps.map((row) => ({
      id: row.id,
      status: row.status,
      timestamp: row.timestamp,
      memo: row.memo,
    })),
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}
