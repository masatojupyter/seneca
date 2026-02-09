import { queryTimescale } from '@/lib/server/infra/timescale';
import { findApplicationsByWorkerId } from '@/lib/server/repository/time-application-repository';

type WorkTimestamp = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: 'WORK' | 'REST' | 'END';
  applicationStatus: string | null;
  applicationId: string | null;
  memo: string | null;
  rejectedApplicationId: string | null;
  rejectionReason: string | null;
  rejectionCategory: string | null;
};

/**
 * 今日の打刻を取得
 */
export async function getTodayTimestamps(workerId: string): Promise<WorkTimestamp[]> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const result = await queryTimescale<Omit<WorkTimestamp, 'applicationId' | 'rejectedApplicationId' | 'rejectionReason' | 'rejectionCategory'>>(
    `SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp >= $2
      AND timestamp < $3
    ORDER BY timestamp ASC`,
    [workerId, startOfDay, endOfDay]
  );

  // PENDING状態の申請を取得し、timestampIdとapplicationIdのマッピングを作成
  const pendingApplications = await findApplicationsByWorkerId(workerId, { status: 'PENDING' });

  // timestampId -> applicationId のマップを作成
  const timestampToApplicationMap = new Map<string, string>();
  for (const app of pendingApplications) {
    for (const timestampId of app.timestampIds) {
      timestampToApplicationMap.set(timestampId, app.id);
    }
  }

  // REJECTED申請を取得し、却下情報のマッピングを作成
  const rejectedApplications = await findApplicationsByWorkerId(workerId, { status: 'REJECTED' });

  const timestampToRejectionMap = new Map<string, {
    applicationId: string;
    rejectionReason: string | null;
    rejectionCategory: string | null;
  }>();

  for (const app of rejectedApplications) {
    for (const timestampId of app.timestampIds) {
      if (!timestampToRejectionMap.has(timestampId)) {
        timestampToRejectionMap.set(timestampId, {
          applicationId: app.id,
          rejectionReason: app.rejectionReason,
          rejectionCategory: app.rejectionCategory,
        });
      }
    }
  }

  // 各打刻にapplicationIdと却下情報を付与
  return result.map(ts => {
    const isNone = !ts.applicationStatus || ts.applicationStatus === 'NONE';
    const rejection = isNone ? timestampToRejectionMap.get(ts.id) : undefined;

    return {
      ...ts,
      applicationId: timestampToApplicationMap.get(ts.id) || null,
      rejectedApplicationId: rejection?.applicationId ?? null,
      rejectionReason: rejection?.rejectionReason ?? null,
      rejectionCategory: rejection?.rejectionCategory ?? null,
    };
  });
}
