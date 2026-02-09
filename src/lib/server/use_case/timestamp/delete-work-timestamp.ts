import { queryTimescale } from '@/lib/server/infra/timescale';

type DeleteWorkTimestampInput = {
  id: string;
  workerId: string;
};

/**
 * 打刻を削除
 */
export async function deleteWorkTimestamp(
  input: DeleteWorkTimestampInput
): Promise<void> {
  const { id, workerId } = input;

  // 既存の打刻を確認
  const existing = await queryTimescale<{ id: string; status: string; timestamp: Date }>(
    `
    SELECT id, status, timestamp
    FROM work_timestamps
    WHERE id = $1 AND worker_id = $2
    `,
    [id, workerId]
  );

  if (existing.length === 0) {
    throw new Error('打刻が見つかりません');
  }

  const now = new Date();

  // 削除ログを記録（ステータス）
  await queryTimescale(
    `
    INSERT INTO work_timestamp_logs (
      timestamp_id,
      worker_id,
      field_name,
      old_value,
      new_value,
      changed_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, workerId, 'status', existing[0].status, 'DELETED', now]
  );

  // 削除ログを記録（打刻時刻）
  await queryTimescale(
    `
    INSERT INTO work_timestamp_logs (
      timestamp_id,
      worker_id,
      field_name,
      old_value,
      new_value,
      changed_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, workerId, 'timestamp', existing[0].timestamp.toISOString(), 'DELETED', now]
  );

  // 打刻を削除
  await queryTimescale(
    `
    DELETE FROM work_timestamps
    WHERE id = $1 AND worker_id = $2
    `,
    [id, workerId]
  );
}
