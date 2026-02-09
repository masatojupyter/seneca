'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getOrganizationWorkers } from '@/lib/server/use_case/admin/get-organization-workers';
import { getWorkerDetail } from '@/lib/server/use_case/admin/get-worker-detail';
import { updateWorker } from '@/lib/server/use_case/admin/update-worker';

export type WorkerListItem = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkerDetail = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalApplications: number;
    approvedApplications: number;
    pendingApplications: number;
    totalPayments: number;
    totalAmountPaid: number;
  };
};

export type GetWorkersResult = {
  success: boolean;
  error?: string;
  workers?: WorkerListItem[];
};

export type GetWorkerDetailResult = {
  success: boolean;
  error?: string;
  worker?: WorkerDetail;
};

const updateWorkerSchema = z.object({
  workerId: z.string().cuid(),
  hourlyRateUsd: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;

export type UpdateWorkerResult = {
  success: boolean;
  error?: string;
  worker?: {
    id: string;
    name: string;
    email: string;
    hourlyRateUsd: number;
    isActive: boolean;
    updatedAt: string;
  };
};

/**
 * 従業員一覧を取得
 */
export async function getWorkersAction(): Promise<GetWorkersResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const workers = await getOrganizationWorkers(session.user.organizationId);

    return {
      success: true,
      workers: workers.map((worker) => ({
        ...worker,
        createdAt: worker.createdAt.toISOString(),
        updatedAt: worker.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get workers error:', error);
    return {
      success: false,
      error: '従業員一覧の取得に失敗しました',
    };
  }
}

/**
 * 従業員詳細を取得
 */
export async function getWorkerDetailAction(workerId: string): Promise<GetWorkerDetailResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const worker = await getWorkerDetail(workerId, session.user.organizationId);

    if (!worker) {
      return {
        success: false,
        error: '従業員が見つかりません',
      };
    }

    return {
      success: true,
      worker: {
        ...worker,
        createdAt: worker.createdAt.toISOString(),
        updatedAt: worker.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get worker detail error:', error);
    return {
      success: false,
      error: '従業員詳細の取得に失敗しました',
    };
  }
}

/**
 * 従業員情報を更新
 */
export async function updateWorkerAction(input: UpdateWorkerInput): Promise<UpdateWorkerResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedData = updateWorkerSchema.parse(input);

    const worker = await updateWorker({
      ...validatedData,
      organizationId: session.user.organizationId,
    });

    return {
      success: true,
      worker: {
        ...worker,
        updatedAt: worker.updatedAt.toISOString(),
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

    console.error('Update worker error:', error);
    return {
      success: false,
      error: '従業員情報の更新に失敗しました',
    };
  }
}
