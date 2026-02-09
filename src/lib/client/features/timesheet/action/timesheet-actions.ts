'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getTimestampsByPeriod } from '@/lib/server/use_case/timestamp/get-timestamps-by-period';
import { updateWorkTimestamp } from '@/lib/server/use_case/timestamp/update-work-timestamp';
import { deleteWorkTimestamp } from '@/lib/server/use_case/timestamp/delete-work-timestamp';

const getTimestampsByPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const updateTimestampSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['WORK', 'REST', 'END']).optional(),
  timestamp: z.string().datetime().optional(),
  memo: z.string().optional(),
});

const deleteTimestampSchema = z.object({
  id: z.string().uuid(),
});

export type GetTimestampsByPeriodInput = z.infer<typeof getTimestampsByPeriodSchema>;
export type UpdateTimestampInput = z.infer<typeof updateTimestampSchema>;
export type DeleteTimestampInput = z.infer<typeof deleteTimestampSchema>;

export type TimestampItem = {
  id: string;
  workerId: string;
  timestamp: string;
  status: string;
  applicationStatus: string | null;
  memo: string | null;
  createdAt: string;
};

export type GetTimestampsResult = {
  success: boolean;
  error?: string;
  timestamps?: TimestampItem[];
};

export type UpdateTimestampResult = {
  success: boolean;
  error?: string;
  timestamp?: TimestampItem;
};

export type DeleteTimestampResult = {
  success: boolean;
  error?: string;
};

/**
 * 期間指定で打刻を取得
 */
export async function getTimestampsByPeriodAction(
  data: GetTimestampsByPeriodInput
): Promise<GetTimestampsResult> {
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
    const validatedData = getTimestampsByPeriodSchema.parse(data);

    // 打刻を取得
    const timestamps = await getTimestampsByPeriod({
      workerId: session.user.id,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
    });

    return {
      success: true,
      timestamps: timestamps.map((ts) => ({
        id: ts.id,
        workerId: ts.workerId,
        timestamp: ts.timestamp.toISOString(),
        status: ts.status,
        applicationStatus: ts.applicationStatus,
        memo: ts.memo,
        createdAt: ts.createdAt.toISOString(),
      })),
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

    console.error('Get timestamps by period error:', error);
    return {
      success: false,
      error: '打刻の取得に失敗しました',
    };
  }
}

/**
 * 打刻を更新
 */
export async function updateTimestampAction(
  data: UpdateTimestampInput
): Promise<UpdateTimestampResult> {
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
    const validatedData = updateTimestampSchema.parse(data);

    // 打刻を更新
    const timestamp = await updateWorkTimestamp({
      id: validatedData.id,
      workerId: session.user.id,
      status: validatedData.status,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : undefined,
      memo: validatedData.memo,
    });

    return {
      success: true,
      timestamp: {
        id: timestamp.id,
        workerId: timestamp.workerId,
        timestamp: timestamp.timestamp.toISOString(),
        status: timestamp.status,
        applicationStatus: timestamp.applicationStatus,
        memo: timestamp.memo,
        createdAt: new Date().toISOString(),
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

    console.error('Update timestamp error:', error);
    return {
      success: false,
      error: '打刻の更新に失敗しました',
    };
  }
}

/**
 * 打刻を削除
 */
export async function deleteTimestampAction(
  data: DeleteTimestampInput
): Promise<DeleteTimestampResult> {
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
    const validatedData = deleteTimestampSchema.parse(data);

    // 打刻を削除
    await deleteWorkTimestamp({
      id: validatedData.id,
      workerId: session.user.id,
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

    console.error('Delete timestamp error:', error);
    return {
      success: false,
      error: '打刻の削除に失敗しました',
    };
  }
}
