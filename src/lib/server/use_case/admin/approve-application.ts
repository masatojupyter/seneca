import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import {
  findApplicationById,
  updateApplication,
} from '@/lib/server/repository/time-application-repository';

export type ApproveApplicationInput = {
  applicationId: string;
  organizationId: string;
  adminId: string;
};

/**
 * 申請を承認
 * - 承認時点の金額を固定保存
 * - 管理者IDを記録
 * - 承認ログをTimescaleDBに記録
 */
export async function approveApplication(input: ApproveApplicationInput): Promise<void> {
  const { applicationId, organizationId, adminId } = input;

  // 申請を取得
  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new Error('申請が見つかりません');
  }

  if (application.organizationId !== organizationId) {
    throw new Error('この申請を承認する権限がありません');
  }

  if (application.status !== 'PENDING') {
    throw new Error('承認可能な申請が見つかりません');
  }

  // 従業員の時給情報を取得
  const worker = await prisma.workerUser.findUnique({
    where: { id: application.workerId },
    select: { hourlyRateUsd: true },
  });

  if (!worker) {
    throw new Error('従業員が見つかりません');
  }

  const now = new Date();
  const hourlyRateAtApproval = Number(worker.hourlyRateUsd);
  const approvedAmountUsd = application.totalAmountUsd;

  // 申請ステータスを承認済みに更新
  await updateApplication({
    id: applicationId,
    status: 'APPROVED',
    approvedAt: now,
    approvedBy: adminId,
    approvedAmountUsd,
    hourlyRateAtApproval,
  });

  // TimescaleDBで打刻ステータスを更新
  await queryTimescale(
    `UPDATE work_timestamps
     SET application_status = 'APPROVED'
     WHERE id = ANY($1)`,
    [application.timestampIds]
  );

  // TimescaleDBに承認ログを記録
  await queryTimescale(
    `INSERT INTO time_application_approval_logs (
      application_id,
      worker_id,
      admin_id,
      action,
      previous_status,
      new_status,
      total_amount_usd,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      applicationId,
      application.workerId,
      adminId,
      'APPROVED',
      'PENDING',
      'APPROVED',
      approvedAmountUsd,
      JSON.stringify({
        hourlyRateAtApproval,
        timestampIds: application.timestampIds,
        sessionIds: application.sessionIds,
        totalMinutes: application.totalMinutes,
      }),
    ]
  );
}
