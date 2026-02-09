import { queryTimescale } from '@/lib/server/infra/timescale';

type WorkTimestamp = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: 'WORK' | 'REST' | 'END';
  applicationStatus: string | null;
  memo: string | null;
  createdAt: Date;
};

type GetTimestampsByPeriodInput = {
  workerId: string;
  startDate: Date;
  endDate: Date;
};

/**
 * 期間指定で打刻を取得
 */
export async function getTimestampsByPeriod(
  input: GetTimestampsByPeriodInput
): Promise<WorkTimestamp[]> {
  const { workerId, startDate, endDate } = input;

  const result = await queryTimescale<WorkTimestamp>(
    `
    SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo,
      created_at as "createdAt"
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp >= $2
      AND timestamp < $3
    ORDER BY timestamp DESC
    `,
    [workerId, startDate, endDate]
  );

  return result;
}
