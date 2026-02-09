import { findApprovedUnpaidApplications } from '@/lib/server/repository/time-application-repository';

type ApprovedApplication = {
  id: string;
  workerId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  createdAt: Date;
};

/**
 * 承認済みで未受領の申請を取得
 */
export async function getApprovedApplications(workerId: string): Promise<ApprovedApplication[]> {
  const applications = await findApprovedUnpaidApplications(workerId);

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
    createdAt: app.createdAt,
  }));
}
