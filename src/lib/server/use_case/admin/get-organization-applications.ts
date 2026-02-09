import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import {
  findApplicationsByOrganizationId,
  type ApplicationStatus,
} from '@/lib/server/repository/time-application-repository';

export type ApplicationListItem = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  timestampIds: string[];
  firstTimestamp: Date | null;
  lastTimestamp: Date | null;
  createdAt: Date;
};

/**
 * 組織の申請一覧を取得
 */
export async function getOrganizationApplications(
  organizationId: string,
  status?: string
): Promise<ApplicationListItem[]> {
  // TimescaleDBから申請を取得
  const applications = await findApplicationsByOrganizationId(
    organizationId,
    status ? { status: status as ApplicationStatus } : undefined
  );

  if (applications.length === 0) {
    return [];
  }

  // 従業員情報を取得
  const workerIds = [...new Set(applications.map(app => app.workerId))];
  const workers = await prisma.workerUser.findMany({
    where: { id: { in: workerIds } },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const workerMap = new Map(workers.map(w => [w.id, w]));

  // 各申請の最初・最後の打刻時刻を取得
  const allTimestampIds = applications.flatMap(app => app.timestampIds);
  type TimestampRange = {
    applicationId: string;
    firstTimestamp: Date;
    lastTimestamp: Date;
  };
  const timestampRanges = allTimestampIds.length > 0
    ? await queryTimescale<TimestampRange>(
        `SELECT
          ta.id as "applicationId",
          MIN(wt.timestamp) as "firstTimestamp",
          MAX(wt.timestamp) as "lastTimestamp"
        FROM time_applications ta
        JOIN work_timestamps wt ON wt.id = ANY(ta.timestamp_ids::uuid[])
        WHERE ta.id = ANY($1)
        GROUP BY ta.id`,
        [applications.map(app => app.id)]
      )
    : [];
  const rangeMap = new Map(timestampRanges.map(r => [r.applicationId, r]));

  return applications.map((app) => {
    const worker = workerMap.get(app.workerId);
    const range = rangeMap.get(app.id);
    return {
      id: app.id,
      workerId: app.workerId,
      workerName: worker?.name || 'Unknown',
      workerEmail: worker?.email || 'Unknown',
      type: app.type,
      startDate: app.startDate,
      endDate: app.endDate,
      totalMinutes: Number(app.totalMinutes),
      totalAmountUsd: Number(app.totalAmountUsd),
      status: app.status,
      memo: app.memo,
      timestampIds: app.timestampIds,
      firstTimestamp: range?.firstTimestamp ?? null,
      lastTimestamp: range?.lastTimestamp ?? null,
      createdAt: app.createdAt,
    };
  });
}
