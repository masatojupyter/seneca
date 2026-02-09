import { queryTimescale } from '@/lib/server/infra/timescale';

// ============================================
// 型定義
// ============================================

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUESTED' | 'PAID';
export type ApplicationType = 'SINGLE' | 'BATCH' | 'PERIOD';
export type RejectionCategory = 'TIME_ERROR' | 'MISSING_REST' | 'DUPLICATE' | 'POLICY_VIOLATION' | 'OTHER';

export type TimeApplication = {
  id: string;
  workerId: string;
  organizationId: string;
  type: ApplicationType;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: ApplicationStatus;
  memo: string | null;
  timestampIds: string[];
  sessionIds: string[] | null;

  // 承認関連
  approvedAt: Date | null;
  approvedBy: string | null;
  approvedAmountUsd: number | null;
  hourlyRateAtApproval: number | null;

  // 却下関連
  rejectionCategory: RejectionCategory | null;
  rejectionReason: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;

  // 再申請関連
  originalApplicationId: string | null;
  resubmitCount: number;

  // 支払い関連
  paymentRequestId: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateApplicationInput = {
  id: string;
  workerId: string;
  organizationId: string;
  type: ApplicationType;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  memo?: string;
  timestampIds: string[];
  sessionIds?: string[];
  originalApplicationId?: string;
  resubmitCount?: number;
};

export type UpdateApplicationInput = {
  id: string;
  status?: ApplicationStatus;
  approvedAt?: Date;
  approvedBy?: string;
  approvedAmountUsd?: number;
  hourlyRateAtApproval?: number;
  rejectionCategory?: RejectionCategory;
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  paymentRequestId?: string;
};

// ============================================
// リポジトリ関数
// ============================================

/**
 * 申請を作成
 */
export async function createApplication(input: CreateApplicationInput): Promise<TimeApplication> {
  const result = await queryTimescale<TimeApplication>(
    `INSERT INTO time_applications (
      id, worker_id, organization_id, type, start_date, end_date,
      total_minutes, total_amount_usd, status, memo, timestamp_ids, session_ids,
      original_application_id, resubmit_count, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11, $12, $13, NOW(), NOW())
    RETURNING
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
      type,
      start_date as "startDate",
      end_date as "endDate",
      total_minutes as "totalMinutes",
      total_amount_usd as "totalAmountUsd",
      status,
      memo,
      timestamp_ids as "timestampIds",
      session_ids as "sessionIds",
      approved_at as "approvedAt",
      approved_by as "approvedBy",
      approved_amount_usd as "approvedAmountUsd",
      hourly_rate_at_approval as "hourlyRateAtApproval",
      rejection_category as "rejectionCategory",
      rejection_reason as "rejectionReason",
      rejected_at as "rejectedAt",
      rejected_by as "rejectedBy",
      original_application_id as "originalApplicationId",
      resubmit_count as "resubmitCount",
      payment_request_id as "paymentRequestId",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      input.id,
      input.workerId,
      input.organizationId,
      input.type,
      input.startDate,
      input.endDate,
      input.totalMinutes,
      input.totalAmountUsd,
      input.memo || null,
      input.timestampIds,
      input.sessionIds || null,
      input.originalApplicationId || null,
      input.resubmitCount || 0,
    ]
  );

  return result[0];
}

/**
 * IDで申請を取得
 */
export async function findApplicationById(id: string): Promise<TimeApplication | null> {
  const result = await queryTimescale<TimeApplication>(
    `SELECT
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
      type,
      start_date as "startDate",
      end_date as "endDate",
      total_minutes as "totalMinutes",
      total_amount_usd as "totalAmountUsd",
      status,
      memo,
      timestamp_ids as "timestampIds",
      session_ids as "sessionIds",
      approved_at as "approvedAt",
      approved_by as "approvedBy",
      approved_amount_usd as "approvedAmountUsd",
      hourly_rate_at_approval as "hourlyRateAtApproval",
      rejection_category as "rejectionCategory",
      rejection_reason as "rejectionReason",
      rejected_at as "rejectedAt",
      rejected_by as "rejectedBy",
      original_application_id as "originalApplicationId",
      resubmit_count as "resubmitCount",
      payment_request_id as "paymentRequestId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM time_applications
    WHERE id = $1`,
    [id]
  );

  return result[0] || null;
}

/**
 * 従業員の申請一覧を取得
 */
export async function findApplicationsByWorkerId(
  workerId: string,
  options?: { status?: ApplicationStatus; limit?: number; offset?: number }
): Promise<TimeApplication[]> {
  let query = `SELECT
    id,
    worker_id as "workerId",
    organization_id as "organizationId",
    type,
    start_date as "startDate",
    end_date as "endDate",
    total_minutes as "totalMinutes",
    total_amount_usd as "totalAmountUsd",
    status,
    memo,
    timestamp_ids as "timestampIds",
    session_ids as "sessionIds",
    approved_at as "approvedAt",
    approved_by as "approvedBy",
    approved_amount_usd as "approvedAmountUsd",
    hourly_rate_at_approval as "hourlyRateAtApproval",
    rejection_category as "rejectionCategory",
    rejection_reason as "rejectionReason",
    rejected_at as "rejectedAt",
    rejected_by as "rejectedBy",
    original_application_id as "originalApplicationId",
    resubmit_count as "resubmitCount",
    payment_request_id as "paymentRequestId",
    created_at as "createdAt",
    updated_at as "updatedAt"
  FROM time_applications
  WHERE worker_id = $1`;

  const params: unknown[] = [workerId];

  if (options?.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(options.status);
  }

  query += ` ORDER BY created_at DESC`;

  if (options?.limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return queryTimescale<TimeApplication>(query, params);
}

/**
 * 組織の申請一覧を取得（管理者用）
 */
export async function findApplicationsByOrganizationId(
  organizationId: string,
  options?: { status?: ApplicationStatus; limit?: number; offset?: number }
): Promise<TimeApplication[]> {
  let query = `SELECT
    id,
    worker_id as "workerId",
    organization_id as "organizationId",
    type,
    start_date as "startDate",
    end_date as "endDate",
    total_minutes as "totalMinutes",
    total_amount_usd as "totalAmountUsd",
    status,
    memo,
    timestamp_ids as "timestampIds",
    session_ids as "sessionIds",
    approved_at as "approvedAt",
    approved_by as "approvedBy",
    approved_amount_usd as "approvedAmountUsd",
    hourly_rate_at_approval as "hourlyRateAtApproval",
    rejection_category as "rejectionCategory",
    rejection_reason as "rejectionReason",
    rejected_at as "rejectedAt",
    rejected_by as "rejectedBy",
    original_application_id as "originalApplicationId",
    resubmit_count as "resubmitCount",
    payment_request_id as "paymentRequestId",
    created_at as "createdAt",
    updated_at as "updatedAt"
  FROM time_applications
  WHERE organization_id = $1`;

  const params: unknown[] = [organizationId];

  if (options?.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(options.status);
  }

  query += ` ORDER BY created_at DESC`;

  if (options?.limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return queryTimescale<TimeApplication>(query, params);
}

/**
 * 申請を更新
 */
export async function updateApplication(input: UpdateApplicationInput): Promise<TimeApplication> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (input.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(input.status);
  }
  if (input.approvedAt !== undefined) {
    updates.push(`approved_at = $${paramIndex++}`);
    params.push(input.approvedAt);
  }
  if (input.approvedBy !== undefined) {
    updates.push(`approved_by = $${paramIndex++}`);
    params.push(input.approvedBy);
  }
  if (input.approvedAmountUsd !== undefined) {
    updates.push(`approved_amount_usd = $${paramIndex++}`);
    params.push(input.approvedAmountUsd);
  }
  if (input.hourlyRateAtApproval !== undefined) {
    updates.push(`hourly_rate_at_approval = $${paramIndex++}`);
    params.push(input.hourlyRateAtApproval);
  }
  if (input.rejectionCategory !== undefined) {
    updates.push(`rejection_category = $${paramIndex++}`);
    params.push(input.rejectionCategory);
  }
  if (input.rejectionReason !== undefined) {
    updates.push(`rejection_reason = $${paramIndex++}`);
    params.push(input.rejectionReason);
  }
  if (input.rejectedAt !== undefined) {
    updates.push(`rejected_at = $${paramIndex++}`);
    params.push(input.rejectedAt);
  }
  if (input.rejectedBy !== undefined) {
    updates.push(`rejected_by = $${paramIndex++}`);
    params.push(input.rejectedBy);
  }
  if (input.paymentRequestId !== undefined) {
    updates.push(`payment_request_id = $${paramIndex++}`);
    params.push(input.paymentRequestId);
  }

  params.push(input.id);

  const result = await queryTimescale<TimeApplication>(
    `UPDATE time_applications
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
      type,
      start_date as "startDate",
      end_date as "endDate",
      total_minutes as "totalMinutes",
      total_amount_usd as "totalAmountUsd",
      status,
      memo,
      timestamp_ids as "timestampIds",
      session_ids as "sessionIds",
      approved_at as "approvedAt",
      approved_by as "approvedBy",
      approved_amount_usd as "approvedAmountUsd",
      hourly_rate_at_approval as "hourlyRateAtApproval",
      rejection_category as "rejectionCategory",
      rejection_reason as "rejectionReason",
      rejected_at as "rejectedAt",
      rejected_by as "rejectedBy",
      original_application_id as "originalApplicationId",
      resubmit_count as "resubmitCount",
      payment_request_id as "paymentRequestId",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    params
  );

  return result[0];
}

/**
 * 申請を削除
 */
export async function deleteApplication(id: string): Promise<void> {
  await queryTimescale(
    `DELETE FROM time_applications WHERE id = $1`,
    [id]
  );
}

/**
 * timestampIdsから申請を検索
 */
export async function findApplicationByTimestampId(
  timestampId: string,
  status?: ApplicationStatus
): Promise<TimeApplication | null> {
  let query = `SELECT
    id,
    worker_id as "workerId",
    organization_id as "organizationId",
    type,
    start_date as "startDate",
    end_date as "endDate",
    total_minutes as "totalMinutes",
    total_amount_usd as "totalAmountUsd",
    status,
    memo,
    timestamp_ids as "timestampIds",
    session_ids as "sessionIds",
    approved_at as "approvedAt",
    approved_by as "approvedBy",
    approved_amount_usd as "approvedAmountUsd",
    hourly_rate_at_approval as "hourlyRateAtApproval",
    rejection_category as "rejectionCategory",
    rejection_reason as "rejectionReason",
    rejected_at as "rejectedAt",
    rejected_by as "rejectedBy",
    original_application_id as "originalApplicationId",
    resubmit_count as "resubmitCount",
    payment_request_id as "paymentRequestId",
    created_at as "createdAt",
    updated_at as "updatedAt"
  FROM time_applications
  WHERE $1 = ANY(timestamp_ids)`;

  const params: unknown[] = [timestampId];

  if (status) {
    query += ` AND status = $2`;
    params.push(status);
  }

  query += ` LIMIT 1`;

  const result = await queryTimescale<TimeApplication>(query, params);
  return result[0] || null;
}

/**
 * 組織の承認待ち申請数を取得
 */
export async function countPendingApplications(organizationId: string): Promise<number> {
  const result = await queryTimescale<{ count: string }>(
    `SELECT COUNT(*) as count FROM time_applications
    WHERE organization_id = $1 AND status = 'PENDING'`,
    [organizationId]
  );

  return parseInt(result[0]?.count || '0', 10);
}

/**
 * 従業員の承認済み未受領申請を取得
 */
export async function findApprovedUnpaidApplications(workerId: string): Promise<TimeApplication[]> {
  return queryTimescale<TimeApplication>(
    `SELECT
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
      type,
      start_date as "startDate",
      end_date as "endDate",
      total_minutes as "totalMinutes",
      total_amount_usd as "totalAmountUsd",
      status,
      memo,
      timestamp_ids as "timestampIds",
      session_ids as "sessionIds",
      approved_at as "approvedAt",
      approved_by as "approvedBy",
      approved_amount_usd as "approvedAmountUsd",
      hourly_rate_at_approval as "hourlyRateAtApproval",
      rejection_category as "rejectionCategory",
      rejection_reason as "rejectionReason",
      rejected_at as "rejectedAt",
      rejected_by as "rejectedBy",
      original_application_id as "originalApplicationId",
      resubmit_count as "resubmitCount",
      payment_request_id as "paymentRequestId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM time_applications
    WHERE worker_id = $1 AND status = 'APPROVED'
    ORDER BY approved_at DESC`,
    [workerId]
  );
}

/**
 * タイムスタンプIDを含む却下済み申請を検索
 *
 * PostgreSQL配列オーバーラップ演算子(&&)を使い、
 * 指定されたタイムスタンプIDのいずれかを含むREJECTED申請を返す
 */
export async function findRejectedApplicationsByTimestampIds(
  workerId: string,
  timestampIds: string[]
): Promise<TimeApplication[]> {
  if (timestampIds.length === 0) {
    return [];
  }

  return queryTimescale<TimeApplication>(
    `SELECT
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
      type,
      start_date as "startDate",
      end_date as "endDate",
      total_minutes as "totalMinutes",
      total_amount_usd as "totalAmountUsd",
      status,
      memo,
      timestamp_ids as "timestampIds",
      session_ids as "sessionIds",
      approved_at as "approvedAt",
      approved_by as "approvedBy",
      approved_amount_usd as "approvedAmountUsd",
      hourly_rate_at_approval as "hourlyRateAtApproval",
      rejection_category as "rejectionCategory",
      rejection_reason as "rejectionReason",
      rejected_at as "rejectedAt",
      rejected_by as "rejectedBy",
      original_application_id as "originalApplicationId",
      resubmit_count as "resubmitCount",
      payment_request_id as "paymentRequestId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM time_applications
    WHERE worker_id = $1
      AND status = 'REJECTED'
      AND timestamp_ids && $2::text[]
    ORDER BY rejected_at DESC`,
    [workerId, timestampIds]
  );
}

/**
 * ID生成（cuid互換）
 */
export function generateApplicationId(): string {
  // cuid形式のID生成（簡易版）
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}
