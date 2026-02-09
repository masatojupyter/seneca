import { queryTimescale } from '@/lib/server/infra/timescale';

type WorkTimestamp = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: 'WORK' | 'REST' | 'END';
  applicationStatus: string | null;
  memo: string | null;
};

/**
 * 今日より前の直近の打刻を取得し、未終了セッションかどうかを判定
 *
 * @returns 未終了セッション（END以外で終わっている場合）の打刻、または null
 */
export async function getLastOpenSession(workerId: string): Promise<WorkTimestamp | null> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // 今日より前の最新の打刻を取得
  const result = await queryTimescale<WorkTimestamp>(
    `
    SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp < $2
    ORDER BY timestamp DESC
    LIMIT 1
    `,
    [workerId, startOfToday]
  );

  if (result.length === 0) {
    return null;
  }

  const lastTimestamp = result[0];

  // 最後の打刻がENDなら、セッションは終了している
  if (lastTimestamp.status === 'END') {
    return null;
  }

  // END以外（WORK, REST）なら未終了セッション
  return lastTimestamp;
}
