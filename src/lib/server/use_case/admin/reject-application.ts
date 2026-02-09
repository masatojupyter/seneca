import { queryTimescale } from '@/lib/server/infra/timescale';
import {
  findApplicationById,
  updateApplication,
  type RejectionCategory,
} from '@/lib/server/repository/time-application-repository';

export type RejectApplicationInput = {
  applicationId: string;
  organizationId: string;
  adminId: string;
  rejectionReason: string;
  rejectionCategory: RejectionCategory;
};

/**
 * 申請を却下
 * - 却下理由とカテゴリを記録
 * - 管理者IDを記録
 * - 却下ログをTimescaleDBに記録
 * - 打刻ステータスをNONEに戻す（再申請可能）
 */
export async function rejectApplication(input: RejectApplicationInput): Promise<void> {
  const { applicationId, organizationId, adminId, rejectionReason, rejectionCategory } = input;

  // バリデーション: 却下理由は10文字以上
  if (rejectionReason.length < 10) {
    throw new Error('却下理由は10文字以上で入力してください');
  }

  // 申請を取得
  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new Error('申請が見つかりません');
  }

  if (application.organizationId !== organizationId) {
    throw new Error('この申請を却下する権限がありません');
  }

  if (application.status !== 'PENDING') {
    throw new Error('却下可能な申請が見つかりません');
  }

  const now = new Date();

  // 申請ステータスを却下に更新
  await updateApplication({
    id: applicationId,
    status: 'REJECTED',
    rejectionReason,
    rejectionCategory,
    rejectedAt: now,
    rejectedBy: adminId,
  });

  // TimescaleDBで打刻ステータスを元に戻す（再申請可能にする）
  await queryTimescale(
    `UPDATE work_timestamps
     SET application_status = 'NONE'
     WHERE id = ANY($1)`,
    [application.timestampIds]
  );

  // TimescaleDBに却下ログを記録
  await queryTimescale(
    `INSERT INTO time_application_approval_logs (
      application_id,
      worker_id,
      admin_id,
      action,
      previous_status,
      new_status,
      rejection_reason,
      total_amount_usd,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      applicationId,
      application.workerId,
      adminId,
      'REJECTED',
      'PENDING',
      'REJECTED',
      rejectionReason,
      application.totalAmountUsd,
      JSON.stringify({
        category: rejectionCategory,
        timestampIds: application.timestampIds,
        sessionIds: application.sessionIds,
        totalMinutes: application.totalMinutes,
      }),
    ]
  );
}
