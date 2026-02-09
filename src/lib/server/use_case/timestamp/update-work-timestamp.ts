import { queryTimescale } from '@/lib/server/infra/timescale';

type UpdateWorkTimestampInput = {
  id: string;
  workerId: string;
  status?: 'WORK' | 'REST' | 'END';
  timestamp?: Date;
  memo?: string;
};

type WorkTimestamp = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: string;
  applicationStatus: string | null;
  memo: string | null;
};

/**
 * 打刻を更新
 */
export async function updateWorkTimestamp(
  input: UpdateWorkTimestampInput
): Promise<WorkTimestamp> {
  const { id, workerId, status, timestamp, memo } = input;

  // 既存の打刻を取得
  const existing = await queryTimescale<WorkTimestamp>(
    `
    SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE id = $1 AND worker_id = $2
    `,
    [id, workerId]
  );

  if (existing.length === 0) {
    throw new Error('打刻が見つかりません');
  }

  const oldTimestamp = existing[0];

  // 更新
  await queryTimescale(
    `
    UPDATE work_timestamps
    SET
      status = COALESCE($3, status),
      timestamp = COALESCE($4, timestamp),
      memo = COALESCE($5, memo)
    WHERE id = $1 AND worker_id = $2
    `,
    [id, workerId, status || null, timestamp || null, memo !== undefined ? memo : null]
  );

  // 更新ログを記録
  if (status && status !== oldTimestamp.status) {
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
      [id, workerId, 'status', oldTimestamp.status, status, new Date()]
    );
  }

  if (timestamp && timestamp.getTime() !== oldTimestamp.timestamp.getTime()) {
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
      [
        id,
        workerId,
        'timestamp',
        oldTimestamp.timestamp.toISOString(),
        timestamp.toISOString(),
        new Date(),
      ]
    );
  }

  if (memo !== undefined && memo !== (oldTimestamp.memo || '')) {
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
      [id, workerId, 'memo', oldTimestamp.memo, memo, new Date()]
    );
  }

  // 更新後の打刻を取得
  const updated = await queryTimescale<WorkTimestamp>(
    `
    SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE id = $1 AND worker_id = $2
    `,
    [id, workerId]
  );

  return updated[0];
}
