import { queryTimescale } from '@/lib/server/infra/timescale';
import {
  findApplicationById,
  deleteApplication,
} from '@/lib/server/repository/time-application-repository';

type CancelTimeApplicationInput = {
  applicationId: string;
  workerId: string;
};

/**
 * 時間申請を取り消す
 * - PENDING状態の申請のみ取消可能
 * - 打刻のapplication_statusをNONEに戻す
 */
export async function cancelTimeApplication(
  input: CancelTimeApplicationInput
): Promise<void> {
  const { applicationId, workerId } = input;

  // 申請を取得（自分の申請かつPENDING状態のみ）
  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new Error('申請が見つかりません');
  }

  if (application.workerId !== workerId) {
    throw new Error('この申請を取り消す権限がありません');
  }

  if (application.status !== 'PENDING') {
    throw new Error('取消可能な申請が見つかりません');
  }

  // 申請を削除
  await deleteApplication(applicationId);

  // TimescaleDBで打刻ステータスを元に戻す
  await queryTimescale(
    `UPDATE work_timestamps
     SET application_status = 'NONE'
     WHERE id = ANY($1) AND worker_id = $2`,
    [application.timestampIds, workerId]
  );

  // ログを記録
  await queryTimescale(
    `INSERT INTO time_application_logs (
      application_id,
      worker_id,
      action,
      type,
      start_date,
      end_date,
      total_minutes,
      total_amount_usd,
      status,
      memo,
      timestamp_ids,
      metadata,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      applicationId,
      workerId,
      'CANCELLED',
      application.type,
      application.startDate,
      application.endDate,
      application.totalMinutes,
      application.totalAmountUsd,
      'CANCELLED',
      application.memo || null,
      application.timestampIds,
      JSON.stringify({ cancelledAt: new Date().toISOString() }),
      new Date(),
    ]
  );
}
