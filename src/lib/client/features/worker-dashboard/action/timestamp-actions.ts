'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { createWorkTimestamp } from '@/lib/server/use_case/timestamp/create-work-timestamp';
import { getTodayTimestamps } from '@/lib/server/use_case/timestamp/get-today-timestamps';
import { getLastOpenSession } from '@/lib/server/use_case/timestamp/get-last-open-session';
import { getTodayTimestampEditHistory } from '@/lib/server/use_case/timestamp/get-today-timestamp-edit-history';
import { getTimestampsByDate } from '@/lib/server/use_case/timestamp/get-timestamps-by-date';
import { getTimestampEditHistoryByDate } from '@/lib/server/use_case/timestamp/get-edit-history-by-date';
import { updateWorkTimestamp } from '@/lib/server/use_case/timestamp/update-work-timestamp';
import { deleteWorkTimestamp } from '@/lib/server/use_case/timestamp/delete-work-timestamp';
import { getSessionTimestampsForEnd } from '@/lib/server/use_case/timestamp/get-current-session-timestamps';

const createTimestampSchema = z.object({
  status: z.enum(['WORK', 'REST', 'END']),
  timestamp: z.string().datetime().optional(),
  memo: z.string().optional(),
});

export type CreateTimestampInput = z.infer<typeof createTimestampSchema>;

export type TimestampResult = {
  success: boolean;
  error?: string;
  timestamp?: {
    id: string;
    workerId: string;
    timestamp: string;
    status: string;
    applicationStatus: string | null;
    memo: string | null;
  };
};

export type TimestampData = {
  id: string;
  workerId: string;
  timestamp: string;
  status: string;
  applicationStatus: string | null;
  applicationId: string | null;
  memo: string | null;
  isPending?: boolean; // 前日以前の未終了打刻かどうか
  rejectedApplicationId: string | null;
  rejectionReason: string | null;
  rejectionCategory: string | null;
};

export type TodayTimestampsResult = {
  success: boolean;
  error?: string;
  timestamps?: TimestampData[];
};

/**
 * 打刻作成
 */
export async function createTimestampAction(
  data: CreateTimestampInput
): Promise<TimestampResult> {
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
    const validatedData = createTimestampSchema.parse(data);

    // 打刻作成
    const timestamp = await createWorkTimestamp({
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

    console.error('Create timestamp error:', error);
    return {
      success: false,
      error: '打刻の作成に失敗しました',
    };
  }
}

/**
 * 今日の打刻を取得
 * 前日以前の未終了打刻がある場合は、それも含めて返す（isPending=true）
 */
export async function getTodayTimestampsAction(): Promise<TodayTimestampsResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // 今日の打刻を取得
    const timestamps = await getTodayTimestamps(session.user.id);

    // 直近の未終了セッションをチェック
    const lastOpenSession = await getLastOpenSession(session.user.id);

    // 結果を構築
    const result: TimestampData[] = [];

    // 未終了打刻がある場合は先頭に追加（isPending=true）
    if (lastOpenSession) {
      result.push({
        id: lastOpenSession.id,
        workerId: lastOpenSession.workerId,
        timestamp: lastOpenSession.timestamp.toISOString(),
        status: lastOpenSession.status,
        applicationStatus: lastOpenSession.applicationStatus,
        applicationId: null,
        memo: lastOpenSession.memo,
        isPending: true,
        rejectedApplicationId: null,
        rejectionReason: null,
        rejectionCategory: null,
      });
    }

    // 今日の打刻を追加
    for (const ts of timestamps) {
      result.push({
        id: ts.id,
        workerId: ts.workerId,
        timestamp: ts.timestamp.toISOString(),
        status: ts.status,
        applicationStatus: ts.applicationStatus,
        applicationId: ts.applicationId,
        memo: ts.memo,
        isPending: false,
        rejectedApplicationId: ts.rejectedApplicationId ?? null,
        rejectionReason: ts.rejectionReason ?? null,
        rejectionCategory: ts.rejectionCategory ?? null,
      });
    }

    return {
      success: true,
      timestamps: result,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get today timestamps error:', error);
    return {
      success: false,
      error: '打刻の取得に失敗しました',
    };
  }
}

export type CurrentWorkStatus = 'NOT_STARTED' | 'WORKING' | 'RESTING' | 'ENDED';

export type PendingSession = {
  id: string;
  timestamp: string;
  status: string;
};

export type TodaySummaryData = {
  workMinutes: number;
  restMinutes: number;
  actualWorkMinutes: number;
  currentStatus: CurrentWorkStatus;
  pendingSession: PendingSession | null;
};

export type TodaySummaryResult = {
  success: boolean;
  error?: string;
  summary?: TodaySummaryData;
};

/**
 * 今日のサマリ（労働時間・休憩時間）を取得
 */
export async function getTodaySummaryAction(): Promise<TodaySummaryResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // 今日の打刻を取得
    const timestamps = await getTodayTimestamps(session.user.id);

    // 直近の未終了セッションをチェック
    const lastOpenSession = await getLastOpenSession(session.user.id);

    // 未終了セッション情報を作成
    const pendingSession: PendingSession | null = lastOpenSession
      ? {
          id: lastOpenSession.id,
          timestamp: lastOpenSession.timestamp.toISOString(),
          status: lastOpenSession.status,
        }
      : null;

    // 労働時間と休憩時間を計算（今日の打刻のみで計算）
    const summary = calculateWorkSummary(timestamps, pendingSession);

    return {
      success: true,
      summary,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get today summary error:', error);
    return {
      success: false,
      error: 'サマリの取得に失敗しました',
    };
  }
}

/**
 * 打刻から労働時間・休憩時間・現在の状態を計算
 *
 * pendingSessionがある場合（前日以前の未終了セッション）:
 * - currentStatusはNOT_STARTEDとして扱う（Workボタンのみ有効）
 * - 時間計算には含めない（今日の打刻のみで計算）
 */
function calculateWorkSummary(
  timestamps: Array<{
    timestamp: Date;
    status: string;
  }>,
  pendingSession: PendingSession | null
): TodaySummaryData {
  let workMinutes = 0;
  let restMinutes = 0;
  let lastWorkStart: Date | null = null;
  let lastRestStart: Date | null = null;
  let hasEnded = false;

  // タイムスタンプを時系列順にソート
  const sorted = [...timestamps].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  for (const ts of sorted) {
    const time = ts.timestamp;

    switch (ts.status) {
      case 'WORK':
        // 終了後のWORKは新セッション開始
        hasEnded = false;
        // 休憩中だった場合、休憩時間を計算
        if (lastRestStart) {
          const restDuration = Math.floor(
            (time.getTime() - lastRestStart.getTime()) / 1000 / 60
          );
          restMinutes += restDuration;
          lastRestStart = null;
        }
        // 作業開始時刻を記録（複数回押された場合は上書き）
        lastWorkStart = time;
        break;

      case 'REST':
        // 作業中だった場合、労働時間を計算
        if (lastWorkStart) {
          const workDuration = Math.floor(
            (time.getTime() - lastWorkStart.getTime()) / 1000 / 60
          );
          workMinutes += workDuration;
          lastWorkStart = null;
        }
        // 休憩開始時刻を記録
        lastRestStart = time;
        break;

      case 'END':
        // 作業中だった場合、労働時間を計算
        if (lastWorkStart) {
          const workDuration = Math.floor(
            (time.getTime() - lastWorkStart.getTime()) / 1000 / 60
          );
          workMinutes += workDuration;
          lastWorkStart = null;
        }
        // 休憩中だった場合、休憩時間を計算
        if (lastRestStart) {
          const restDuration = Math.floor(
            (time.getTime() - lastRestStart.getTime()) / 1000 / 60
          );
          restMinutes += restDuration;
          lastRestStart = null;
        }
        hasEnded = true;
        break;
    }
  }

  // 現在も作業中または休憩中の場合、現在時刻までを計算
  const now = new Date();
  if (lastWorkStart) {
    const workDuration = Math.floor(
      (now.getTime() - lastWorkStart.getTime()) / 1000 / 60
    );
    workMinutes += workDuration;
  }
  if (lastRestStart) {
    const restDuration = Math.floor(
      (now.getTime() - lastRestStart.getTime()) / 1000 / 60
    );
    restMinutes += restDuration;
  }

  // 実働時間 = 労働時間
  const actualWorkMinutes = workMinutes;

  // 現在の状態を判定
  // pendingSessionがある場合は、そのステータスに基づいてWORKINGまたはRESTINGを設定
  let currentStatus: CurrentWorkStatus;
  if (pendingSession) {
    // 未終了セッションがある場合、そのステータスに基づいて現在の状態を設定
    // これにより、適切なボタンが有効になる
    if (pendingSession.status === 'WORK') {
      currentStatus = 'WORKING';
    } else if (pendingSession.status === 'REST') {
      currentStatus = 'RESTING';
    } else {
      // 通常はここには来ないが、念のため
      currentStatus = 'NOT_STARTED';
    }
  } else if (sorted.length === 0) {
    currentStatus = 'NOT_STARTED';
  } else if (hasEnded) {
    currentStatus = 'ENDED';
  } else if (lastRestStart) {
    currentStatus = 'RESTING';
  } else if (lastWorkStart) {
    currentStatus = 'WORKING';
  } else {
    // 通常はここには来ないが、念のため
    currentStatus = 'NOT_STARTED';
  }

  return {
    workMinutes,
    restMinutes,
    actualWorkMinutes,
    currentStatus,
    pendingSession,
  };
}

export type AvailableBalanceData = {
  totalAmountUsd: number;
  cryptoAmount: number;
  cryptoType: string;
  exchangeRate: number;
};

export type AvailableBalanceResult = {
  success: boolean;
  error?: string;
  balance?: AvailableBalanceData;
};

/**
 * 受領可能残高を取得
 *
 * 承認済みで未受領の給与総額を計算
 */
export async function getAvailableBalanceAction(): Promise<AvailableBalanceResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // TODO: 実装
    // 1. 承認済み申請（status='APPROVED'）で未受領のものを取得
    // 2. 合計金額（USD）を計算
    // 3. 現在の為替レート（XRP/USD）を取得
    // 4. XRP換算額を計算

    // 仮実装: ダミーデータを返す
    return {
      success: true,
      balance: {
        totalAmountUsd: 0,
        cryptoAmount: 0,
        cryptoType: 'XRP',
        exchangeRate: 0,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get available balance error:', error);
    return {
      success: false,
      error: '残高の取得に失敗しました',
    };
  }
}

export type TimestampEditHistoryData = {
  id: string;
  timestampId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  originalTimestamp: string | null;
  originalStatus: string | null;
};

export type TodayEditHistoryResult = {
  success: boolean;
  error?: string;
  history?: TimestampEditHistoryData[];
};

/**
 * 今日の打刻編集履歴を取得
 */
export async function getTodayEditHistoryAction(): Promise<TodayEditHistoryResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // 今日の編集履歴を取得
    const history = await getTodayTimestampEditHistory(session.user.id);

    return {
      success: true,
      history: history.map((h) => ({
        id: h.id,
        timestampId: h.timestampId,
        fieldName: h.fieldName,
        oldValue: h.oldValue,
        newValue: h.newValue,
        changedAt: h.changedAt.toISOString(),
        originalTimestamp: h.originalTimestamp?.toISOString() ?? null,
        originalStatus: h.originalStatus,
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get today edit history error:', error);
    return {
      success: false,
      error: '編集履歴の取得に失敗しました',
    };
  }
}

const updateTimestampSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  status: z.enum(['WORK', 'REST', 'END']),
  memo: z.string().max(500).optional(),
});

export type UpdateTimestampInput = z.infer<typeof updateTimestampSchema>;

export type UpdateTimestampResult = {
  success: boolean;
  error?: string;
  timestamp?: {
    id: string;
    workerId: string;
    timestamp: string;
    status: string;
    applicationStatus: string | null;
    memo: string | null;
  };
};

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

    // 日付と時刻を結合してDateオブジェクトを作成
    const newTimestamp = new Date(`${validatedData.date}T${validatedData.time}:00`);

    // 打刻更新
    const timestamp = await updateWorkTimestamp({
      id: validatedData.id,
      workerId: session.user.id,
      status: validatedData.status,
      timestamp: newTimestamp,
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

const updateMemoSchema = z.object({
  id: z.string(),
  memo: z.string().max(500),
});

export type UpdateMemoInput = z.infer<typeof updateMemoSchema>;

export type UpdateMemoResult = {
  success: boolean;
  error?: string;
};

/**
 * 打刻のメモのみを更新
 */
export async function updateTimestampMemoAction(
  data: UpdateMemoInput
): Promise<UpdateMemoResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validatedData = updateMemoSchema.parse(data);

    await updateWorkTimestamp({
      id: validatedData.id,
      workerId: session.user.id,
      memo: validatedData.memo,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    console.error('Update memo error:', error);
    return { success: false, error: 'メモの更新に失敗しました' };
  }
}

const deleteTimestampSchema = z.object({
  id: z.string(),
});

export type DeleteTimestampInput = z.infer<typeof deleteTimestampSchema>;

export type DeleteTimestampResult = {
  success: boolean;
  error?: string;
};

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

    // 打刻削除
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

export type SessionTimestampData = {
  id: string;
  workerId: string;
  timestamp: string;
  status: string;
  applicationStatus: string | null;
  memo: string | null;
};

export type GetSessionTimestampsResult = {
  success: boolean;
  error?: string;
  timestamps?: SessionTimestampData[];
  previousEndTimestamp?: string | null;
  hasWork?: boolean;
  isComplete?: boolean;
};

/**
 * 指定したENDの打刻に対応するセッションの打刻を取得
 *
 * 直近の申請済みENDの次のWORKから、指定したENDまでの打刻を返す
 */
export async function getSessionTimestampsForEndAction(
  endTimestampId: string
): Promise<GetSessionTimestampsResult> {
  try {
    // 認証チェック
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const result = await getSessionTimestampsForEnd(session.user.id, endTimestampId);

    return {
      success: true,
      timestamps: result.timestamps.map((ts) => ({
        id: ts.id,
        workerId: ts.workerId,
        timestamp: ts.timestamp.toISOString(),
        status: ts.status,
        applicationStatus: ts.applicationStatus,
        memo: ts.memo,
      })),
      previousEndTimestamp: result.previousEndTimestamp?.toISOString() || null,
      hasWork: result.hasWork,
      isComplete: result.isComplete,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get session timestamps error:', error);
    return {
      success: false,
      error: 'セッションの打刻取得に失敗しました',
    };
  }
}

const getTimestampsByDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で指定してください'),
});

export type TimestampsByDateResult = {
  success: boolean;
  error?: string;
  timestamps?: TimestampData[];
};

/**
 * 指定日の打刻を取得
 *
 * 今日の場合は未終了セッション（pending）も含める
 * 過去日の場合は打刻のみ返す
 */
export async function getTimestampsByDateAction(
  dateString: string
): Promise<TimestampsByDateResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = getTimestampsByDateSchema.parse({ date: dateString });
    const [year, month, day] = validated.date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);

    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    if (isToday) {
      // 今日の場合は既存ロジック（pending session含む）を使用
      const timestamps = await getTodayTimestamps(session.user.id);
      const lastOpenSession = await getLastOpenSession(session.user.id);

      const result: TimestampData[] = [];

      if (lastOpenSession) {
        result.push({
          id: lastOpenSession.id,
          workerId: lastOpenSession.workerId,
          timestamp: lastOpenSession.timestamp.toISOString(),
          status: lastOpenSession.status,
          applicationStatus: lastOpenSession.applicationStatus,
          applicationId: null,
          memo: lastOpenSession.memo,
          isPending: true,
          rejectedApplicationId: null,
          rejectionReason: null,
          rejectionCategory: null,
        });
      }

      for (const ts of timestamps) {
        result.push({
          id: ts.id,
          workerId: ts.workerId,
          timestamp: ts.timestamp.toISOString(),
          status: ts.status,
          applicationStatus: ts.applicationStatus,
          applicationId: ts.applicationId,
          memo: ts.memo,
          isPending: false,
          rejectedApplicationId: ts.rejectedApplicationId ?? null,
          rejectionReason: ts.rejectionReason ?? null,
          rejectionCategory: ts.rejectionCategory ?? null,
        });
      }

      return { success: true, timestamps: result };
    }

    // 過去日の場合
    const timestamps = await getTimestampsByDate(session.user.id, targetDate);

    return {
      success: true,
      timestamps: timestamps.map((ts) => ({
        id: ts.id,
        workerId: ts.workerId,
        timestamp: ts.timestamp.toISOString(),
        status: ts.status,
        applicationStatus: ts.applicationStatus,
        applicationId: ts.applicationId,
        memo: ts.memo,
        isPending: false,
        rejectedApplicationId: ts.rejectedApplicationId ?? null,
        rejectionReason: ts.rejectionReason ?? null,
        rejectionCategory: ts.rejectionCategory ?? null,
      })),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    console.error('Get timestamps by date error:', error);
    return { success: false, error: '打刻の取得に失敗しました' };
  }
}

export type EditHistoryByDateResult = {
  success: boolean;
  error?: string;
  history?: TimestampEditHistoryData[];
};

/**
 * 指定日の打刻編集履歴を取得
 */
export async function getEditHistoryByDateAction(
  dateString: string
): Promise<EditHistoryByDateResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = getTimestampsByDateSchema.parse({ date: dateString });
    const [year, month, day] = validated.date.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);

    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    const history = isToday
      ? await getTodayTimestampEditHistory(session.user.id)
      : await getTimestampEditHistoryByDate(session.user.id, targetDate);

    return {
      success: true,
      history: history.map((h) => ({
        id: h.id,
        timestampId: h.timestampId,
        fieldName: h.fieldName,
        oldValue: h.oldValue,
        newValue: h.newValue,
        changedAt: h.changedAt.toISOString(),
        originalTimestamp: h.originalTimestamp?.toISOString() ?? null,
        originalStatus: h.originalStatus,
      })),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    console.error('Get edit history by date error:', error);
    return { success: false, error: '編集履歴の取得に失敗しました' };
  }
}
