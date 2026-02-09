import { findApplicationsByWorkerId } from '@/lib/server/repository/time-application-repository';

type TimeApplication = {
  id: string;
  workerId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  timestampIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 従業員の申請一覧を取得
 */
export async function getWorkerApplications(workerId: string): Promise<TimeApplication[]> {
  const applications = await findApplicationsByWorkerId(workerId);

  return applications.map((app) => ({
    id: app.id,
    workerId: app.workerId,
    type: app.type,
    startDate: app.startDate,
    endDate: app.endDate,
    totalMinutes: Number(app.totalMinutes),
    totalAmountUsd: Number(app.totalAmountUsd),
    status: app.status,
    memo: app.memo,
    timestampIds: app.timestampIds,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }));
}
