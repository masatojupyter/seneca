import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import {
  createApplication,
  findApplicationById,
  generateApplicationId,
  type TimeApplication,
} from '@/lib/server/repository/time-application-repository';

type CreateTimeApplicationInput = {
  workerId: string;
  startDate: Date;
  endDate: Date;
  timestampIds: string[];
  memo?: string;
  originalApplicationId?: string; // 再申請時の元申請ID
};

type CreateTimeApplicationResult = {
  id: string;
  workerId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  timestampIds: string[];
};

/**
 * 勤務時間を計算（分単位）
 * Work -> End または Work -> Rest のペアを探して計算
 * ミリ秒単位で合算してから分に変換することで、短い勤務ペアの端数が失われないようにする
 */
function calculateWorkMinutes(timestamps: Array<{ timestamp: Date; status: string }>): number {
  let totalMs = 0;
  let workStart: Date | null = null;

  for (const ts of timestamps) {
    if (ts.status === 'WORK') {
      // 作業中でなければ開始時刻を記録（連続WORKの場合は最初のWORKを維持）
      // REST後のWORKは新規開始（RESTでworkStartがnullになるため）
      if (!workStart) {
        workStart = ts.timestamp;
      }
    } else if (ts.status === 'REST' && workStart) {
      // Work -> Rest: 勤務時間を加算
      totalMs += ts.timestamp.getTime() - workStart.getTime();
      workStart = null;
    } else if (ts.status === 'END') {
      if (workStart) {
        // Work -> End: 勤務時間を加算
        totalMs += ts.timestamp.getTime() - workStart.getTime();
        workStart = null;
      }
    }
  }

  return Math.floor(totalMs / (1000 * 60));
}

/**
 * 時間申請を作成
 */
export async function createTimeApplication(
  input: CreateTimeApplicationInput
): Promise<CreateTimeApplicationResult> {
  const { workerId, startDate, endDate, timestampIds, memo, originalApplicationId } = input;

  // 従業員情報を取得（時給と組織IDを取得）
  const worker = await prisma.workerUser.findUnique({
    where: { id: workerId },
    select: { hourlyRateUsd: true, organizationId: true },
  });

  if (!worker) {
    throw new Error('従業員が見つかりません');
  }

  // 指定された打刻を取得
  const timestamps = await queryTimescale<{ id: string; timestamp: Date; status: string }>(
    `SELECT id, timestamp, status
    FROM work_timestamps
    WHERE id = ANY($1) AND worker_id = $2
    ORDER BY timestamp ASC`,
    [timestampIds, workerId]
  );

  if (timestamps.length === 0) {
    throw new Error('打刻が見つかりません');
  }

  // 勤務時間を計算
  const totalMinutes = calculateWorkMinutes(timestamps);

  if (totalMinutes === 0) {
    throw new Error('勤務時間が0分です。正しいペア（Work→EndまたはWork→Rest）が必要です');
  }

  // 給与額を計算
  const totalAmountUsd = (totalMinutes / 60) * Number(worker.hourlyRateUsd);

  // 申請タイプを判定
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const type = daysDiff === 0 ? 'SINGLE' : daysDiff <= 7 ? 'BATCH' : 'PERIOD';

  // 再申請の場合、元申請の情報を取得
  let resubmitCount = 0;
  if (originalApplicationId) {
    const originalApplication = await findApplicationById(originalApplicationId);

    if (!originalApplication) {
      throw new Error('元の申請が見つかりません');
    }

    if (originalApplication.status !== 'REJECTED') {
      throw new Error('却下された申請に対してのみ再申請が可能です');
    }

    resubmitCount = originalApplication.resubmitCount + 1;
  }

  // 申請IDを生成
  const applicationId = generateApplicationId();

  // TimescaleDBに申請を作成
  const application = await createApplication({
    id: applicationId,
    workerId,
    organizationId: worker.organizationId,
    type: type as 'SINGLE' | 'BATCH' | 'PERIOD',
    startDate,
    endDate,
    totalMinutes,
    totalAmountUsd,
    memo,
    timestampIds,
    originalApplicationId,
    resubmitCount,
  });

  // 打刻のapplication_statusを更新
  await queryTimescale(
    `UPDATE work_timestamps
    SET application_status = 'PENDING'
    WHERE id = ANY($1) AND worker_id = $2`,
    [timestampIds, workerId]
  );

  // ログを記録
  const action = originalApplicationId ? 'RESUBMITTED' : 'CREATED';
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
      application.id,
      workerId,
      action,
      type,
      startDate,
      endDate,
      totalMinutes,
      totalAmountUsd,
      'PENDING',
      memo || null,
      timestampIds,
      JSON.stringify({
        originalApplicationId: originalApplicationId || null,
        resubmitCount,
      }),
      new Date(),
    ]
  );

  return {
    id: application.id,
    workerId: application.workerId,
    type: application.type,
    startDate: application.startDate,
    endDate: application.endDate,
    totalMinutes: Number(application.totalMinutes),
    totalAmountUsd: Number(application.totalAmountUsd),
    status: application.status,
    memo: application.memo,
    timestampIds: application.timestampIds,
  };
}
