import { queryTimescale } from '@/lib/server/infra/timescale';

type TimestampEditHistory = {
  id: string;
  timestampId: string;
  workerId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
  originalTimestamp: Date | null;
  originalStatus: string | null;
};

/**
 * 指定日の打刻編集履歴を取得
 */
export async function getTimestampEditHistoryByDate(
  workerId: string,
  date: Date
): Promise<TimestampEditHistory[]> {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const result = await queryTimescale<TimestampEditHistory>(
    `
    SELECT
      l.id,
      l.timestamp_id as "timestampId",
      l.worker_id as "workerId",
      l.field_name as "fieldName",
      l.old_value as "oldValue",
      l.new_value as "newValue",
      l.changed_at as "changedAt",
      t.timestamp as "originalTimestamp",
      t.status as "originalStatus"
    FROM work_timestamp_logs l
    LEFT JOIN work_timestamps t ON l.timestamp_id = t.id
    WHERE l.worker_id = $1
      AND l.changed_at >= $2
      AND l.changed_at < $3
    ORDER BY l.changed_at DESC
    `,
    [workerId, startOfDay, endOfDay]
  );

  return result;
}
