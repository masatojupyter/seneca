'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getOrganizationApplications } from '@/lib/server/use_case/admin/get-organization-applications';
import { getApplicationDetail } from '@/lib/server/use_case/admin/get-application-detail';
import { approveApplication } from '@/lib/server/use_case/admin/approve-application';
import { rejectApplication } from '@/lib/server/use_case/admin/reject-application';

export type ApplicationListItem = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  timestampIds: string[];
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  createdAt: string;
};

export type ApplicationDetail = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  workerHourlyRate: number;
  type: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  rejectionReason: string | null;
  timestampIds: string[];
  timestamps: Array<{
    id: string;
    status: string;
    timestamp: string;
    memo: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type GetApplicationsResult = {
  success: boolean;
  error?: string;
  applications?: ApplicationListItem[];
};

export type GetApplicationDetailResult = {
  success: boolean;
  error?: string;
  application?: ApplicationDetail;
};

const rejectionCategoryValues = ['TIME_ERROR', 'MISSING_REST', 'DUPLICATE', 'POLICY_VIOLATION', 'OTHER'] as const;

const rejectApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  rejectionReason: z.string().min(10, '却下理由は10文字以上で入力してください'),
  rejectionCategory: z.enum(rejectionCategoryValues, {
    errorMap: () => ({ message: '却下カテゴリを選択してください' }),
  }),
});

export type ApproveApplicationResult = {
  success: boolean;
  error?: string;
};

export type BulkApproveApplicationsResult = {
  success: boolean;
  error?: string;
  approvedCount?: number;
  failedIds?: string[];
};

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

export type RejectApplicationResult = {
  success: boolean;
  error?: string;
};

/**
 * 申請一覧を取得
 */
export async function getApplicationsAction(
  status?: string
): Promise<GetApplicationsResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const applications = await getOrganizationApplications(
      session.user.organizationId,
      status
    );

    return {
      success: true,
      applications: applications.map((app) => ({
        ...app,
        totalAmountUsd: Number(app.totalAmountUsd),
        startDate: app.startDate.toISOString(),
        endDate: app.endDate.toISOString(),
        firstTimestamp: app.firstTimestamp?.toISOString() ?? null,
        lastTimestamp: app.lastTimestamp?.toISOString() ?? null,
        createdAt: app.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get applications error:', error);
    return {
      success: false,
      error: '申請一覧の取得に失敗しました',
    };
  }
}

/**
 * 申請詳細を取得
 */
export async function getApplicationDetailAction(
  applicationId: string
): Promise<GetApplicationDetailResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const application = await getApplicationDetail(
      applicationId,
      session.user.organizationId
    );

    if (!application) {
      return {
        success: false,
        error: '申請が見つかりません',
      };
    }

    return {
      success: true,
      application: {
        ...application,
        totalAmountUsd: Number(application.totalAmountUsd),
        workerHourlyRate: Number(application.workerHourlyRate),
        startDate: application.startDate.toISOString(),
        endDate: application.endDate.toISOString(),
        timestamps: application.timestamps.map((ts) => ({
          ...ts,
          timestamp: ts.timestamp.toISOString(),
        })),
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get application detail error:', error);
    return {
      success: false,
      error: '申請詳細の取得に失敗しました',
    };
  }
}

/**
 * 申請を承認
 */
export async function approveApplicationAction(
  applicationId: string
): Promise<ApproveApplicationResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    await approveApplication({
      applicationId,
      organizationId: session.user.organizationId,
      adminId: session.user.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Approve application error:', error);
    return {
      success: false,
      error: '申請の承認に失敗しました',
    };
  }
}

/**
 * 申請を一括承認
 */
export async function bulkApproveApplicationsAction(
  applicationIds: string[]
): Promise<BulkApproveApplicationsResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    if (applicationIds.length === 0) {
      return {
        success: false,
        error: '承認する申請を選択してください',
      };
    }

    const failedIds: string[] = [];
    let approvedCount = 0;

    for (const applicationId of applicationIds) {
      try {
        await approveApplication({
          applicationId,
          organizationId: session.user.organizationId,
          adminId: session.user.id,
        });
        approvedCount++;
      } catch {
        failedIds.push(applicationId);
      }
    }

    if (failedIds.length > 0) {
      return {
        success: true,
        approvedCount,
        failedIds,
        error: `${failedIds.length}件の承認に失敗しました`,
      };
    }

    return {
      success: true,
      approvedCount,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Bulk approve applications error:', error);
    return {
      success: false,
      error: '一括承認に失敗しました',
    };
  }
}

/**
 * 申請を却下
 */
export async function rejectApplicationAction(
  input: RejectApplicationInput
): Promise<RejectApplicationResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId || !session?.user?.id) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedData = rejectApplicationSchema.parse(input);

    await rejectApplication({
      ...validatedData,
      organizationId: session.user.organizationId,
      adminId: session.user.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Reject application error:', error);
    return {
      success: false,
      error: '申請の却下に失敗しました',
    };
  }
}
