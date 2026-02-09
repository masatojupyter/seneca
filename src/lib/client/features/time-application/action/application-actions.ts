'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { createTimeApplication } from '@/lib/server/use_case/time-application/create-time-application';
import { getWorkerApplications } from '@/lib/server/use_case/time-application/get-worker-applications';
import { cancelTimeApplication } from '@/lib/server/use_case/time-application/cancel-time-application';

const createApplicationSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  timestampIds: z.array(z.string().uuid()).min(1, '少なくとも1つの打刻を選択してください'),
  memo: z.string().optional(),
  originalApplicationId: z.string().cuid().optional(), // 再申請時の元申請ID
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export type ApplicationItem = {
  id: string;
  workerId: string;
  type: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  timestampIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateApplicationResult = {
  success: boolean;
  error?: string;
  application?: ApplicationItem;
};

export type GetApplicationsResult = {
  success: boolean;
  error?: string;
  applications?: ApplicationItem[];
};

export type CancelApplicationResult = {
  success: boolean;
  error?: string;
};

/**
 * 時間申請を作成
 */
export async function createApplicationAction(
  data: CreateApplicationInput
): Promise<CreateApplicationResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedData = createApplicationSchema.parse(data);

    // 申請を作成
    const application = await createTimeApplication({
      workerId: session.user.id,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      timestampIds: validatedData.timestampIds,
      memo: validatedData.memo,
      originalApplicationId: validatedData.originalApplicationId,
    });

    return {
      success: true,
      application: {
        id: application.id,
        workerId: application.workerId,
        type: application.type,
        startDate: application.startDate.toISOString(),
        endDate: application.endDate.toISOString(),
        totalMinutes: application.totalMinutes,
        totalAmountUsd: application.totalAmountUsd,
        status: application.status,
        memo: application.memo,
        timestampIds: application.timestampIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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

    console.error('Create application error:', error);
    return {
      success: false,
      error: '申請の作成に失敗しました',
    };
  }
}

/**
 * 申請一覧を取得
 */
export async function getApplicationsAction(): Promise<GetApplicationsResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // 申請を取得
    const applications = await getWorkerApplications(session.user.id);

    return {
      success: true,
      applications: applications.map((app) => ({
        id: app.id,
        workerId: app.workerId,
        type: app.type,
        startDate: app.startDate.toISOString(),
        endDate: app.endDate.toISOString(),
        totalMinutes: app.totalMinutes,
        totalAmountUsd: app.totalAmountUsd,
        status: app.status,
        memo: app.memo,
        timestampIds: app.timestampIds,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
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
      error: '申請の取得に失敗しました',
    };
  }
}

/**
 * 申請を取り消す（PENDING状態のみ）
 */
export async function cancelApplicationAction(
  applicationId: string
): Promise<CancelApplicationResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    await cancelTimeApplication({
      applicationId,
      workerId: session.user.id,
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

    console.error('Cancel application error:', error);
    return {
      success: false,
      error: '申請の取消に失敗しました',
    };
  }
}
