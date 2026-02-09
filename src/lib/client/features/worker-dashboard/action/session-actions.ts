'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getMonthlySessions } from '@/lib/server/use_case/time-application/get-monthly-sessions';

const getMonthlySessionsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export type MonthlySessionData = {
  date: string;
  startTime: string;
  endTime: string | null;
  timestampIds: string[];
  workMinutes: number;
  restMinutes: number;
  status: string;
  rejectedApplicationId: string | null;
  rejectionReason: string | null;
  rejectionCategory: string | null;
};

export type GetMonthlySessionsResult = {
  success: boolean;
  error?: string;
  sessions?: MonthlySessionData[];
  year?: number;
  month?: number;
};

/**
 * 月次セッション一覧を取得
 */
export async function getMonthlySessionsAction(
  data: { year: number; month: number }
): Promise<GetMonthlySessionsResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = getMonthlySessionsSchema.parse(data);

    const result = await getMonthlySessions({
      workerId: session.user.id,
      year: validated.year,
      month: validated.month,
    });

    return {
      success: true,
      sessions: result.sessions,
      year: result.year,
      month: result.month,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    console.error('Get monthly sessions error:', error);
    return { success: false, error: '月次セッションの取得に失敗しました' };
  }
}
