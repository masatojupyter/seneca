import { queryTimescale } from '@/lib/server/infra/timescale';
import { v4 as uuidv4 } from 'uuid';

type CreateWorkTimestampInput = {
  workerId: string;
  status: 'WORK' | 'REST' | 'END';
  timestamp?: Date; // 省略時は現在時刻
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
 * 打刻を作成
 */
export async function createWorkTimestamp(
  input: CreateWorkTimestampInput
): Promise<WorkTimestamp> {
  const { workerId, status, timestamp = new Date(), memo } = input;

  const id = uuidv4();
  const applicationStatus = 'NONE'; // 初期は未申請

  // TimescaleDBに打刻を挿入
  await queryTimescale(
    `
    INSERT INTO work_timestamps (
      id,
      worker_id,
      status,
      timestamp,
      memo,
      application_status
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, workerId, status, timestamp, memo || null, applicationStatus]
  );

  // 打刻ログを記録
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
      'status',
      null,
      status,
      new Date(),
    ]
  );

  return {
    id,
    workerId,
    timestamp,
    status,
    applicationStatus,
    memo: memo || null,
  };
}
