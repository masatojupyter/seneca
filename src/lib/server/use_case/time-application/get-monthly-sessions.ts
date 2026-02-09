import { queryTimescale } from '@/lib/server/infra/timescale';
import { findRejectedApplicationsByTimestampIds } from '@/lib/server/repository/time-application-repository';

// ============================================
// 型定義
// ============================================

type TimestampRow = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: 'WORK' | 'REST' | 'END';
  applicationStatus: string | null;
};

type SessionStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUESTED' | 'PAID' | 'INCOMPLETE';

export type MonthlySession = {
  date: string;
  startTime: string;
  endTime: string | null;
  timestampIds: string[];
  workMinutes: number;
  restMinutes: number;
  status: SessionStatus;
  rejectedApplicationId: string | null;
  rejectionReason: string | null;
  rejectionCategory: string | null;
};

export type GetMonthlySessionsInput = {
  workerId: string;
  year: number;
  month: number;
};

export type GetMonthlySessionsResult = {
  sessions: MonthlySession[];
  year: number;
  month: number;
};

// ============================================
// セッション抽出ロジック
// ============================================

type RawSession = {
  timestamps: TimestampRow[];
  isComplete: boolean;
  startTime: Date;
  endTime: Date | null;
};

/**
 * タイムスタンプ列からセッションを抽出
 *
 * TodayTimestampList.tsx の extractSessions と同じアルゴリズム:
 * - 各ENDに対して、直前のENDの次の打刻からそのENDまでをセッションとする
 * - 直前のENDがなければ、最初の打刻からそのENDまでをセッションとする
 * - 最後にENDで終わっていない打刻群は未完結セッションとして扱う
 */
function extractSessions(timestamps: TimestampRow[]): RawSession[] {
  const sessions: RawSession[] = [];

  const sorted = [...timestamps].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  // 各ENDに対してセッションを抽出
  for (let i = 0; i < sorted.length; i++) {
    const ts = sorted[i];

    if (ts.status === 'END') {
      let prevEndIndex = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (sorted[j].status === 'END') {
          prevEndIndex = j;
          break;
        }
      }

      const startIndex = prevEndIndex + 1;
      const sessionTimestamps = sorted.slice(startIndex, i + 1);

      if (sessionTimestamps.length === 0) {
        continue;
      }

      sessions.push({
        timestamps: sessionTimestamps,
        isComplete: true,
        startTime: sessionTimestamps[0].timestamp,
        endTime: ts.timestamp,
      });
    }
  }

  // 未完結セッション（ENDで終わっていない）
  if (sorted.length > 0) {
    const lastTimestamp = sorted[sorted.length - 1];
    if (lastTimestamp.status !== 'END') {
      let lastEndIndex = -1;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].status === 'END') {
          lastEndIndex = i;
          break;
        }
      }

      const startIndex = lastEndIndex + 1;
      const remainingTimestamps = sorted.slice(startIndex);

      if (remainingTimestamps.length > 0) {
        sessions.push({
          timestamps: remainingTimestamps,
          isComplete: false,
          startTime: remainingTimestamps[0].timestamp,
          endTime: null,
        });
      }
    }
  }

  return sessions;
}

// ============================================
// 勤務時間・休憩時間の計算
// ============================================

type DurationResult = {
  workMinutes: number;
  restMinutes: number;
};

function calculateDuration(timestamps: TimestampRow[]): DurationResult {
  let workMinutes = 0;
  let restMinutes = 0;
  let workStart: Date | null = null;
  let restStart: Date | null = null;

  const sorted = [...timestamps].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  for (const ts of sorted) {
    if (ts.status === 'WORK') {
      if (restStart) {
        restMinutes += Math.floor(
          (ts.timestamp.getTime() - restStart.getTime()) / (1000 * 60)
        );
        restStart = null;
      }
      workStart = ts.timestamp;
    } else if (ts.status === 'REST') {
      if (workStart) {
        workMinutes += Math.floor(
          (ts.timestamp.getTime() - workStart.getTime()) / (1000 * 60)
        );
        workStart = null;
      }
      restStart = ts.timestamp;
    } else if (ts.status === 'END') {
      if (workStart) {
        workMinutes += Math.floor(
          (ts.timestamp.getTime() - workStart.getTime()) / (1000 * 60)
        );
        workStart = null;
      }
      if (restStart) {
        restMinutes += Math.floor(
          (ts.timestamp.getTime() - restStart.getTime()) / (1000 * 60)
        );
        restStart = null;
      }
    }
  }

  return { workMinutes, restMinutes };
}

// ============================================
// ステータス判定
// ============================================

function resolveSessionStatus(timestamps: TimestampRow[], isComplete: boolean): SessionStatus | null {
  if (!isComplete) {
    return 'INCOMPLETE';
  }

  const statuses = timestamps.map(ts => ts.applicationStatus || 'NONE');
  const uniqueStatuses = [...new Set(statuses)];

  // 全タイムスタンプが同じステータスの場合
  if (uniqueStatuses.length === 1) {
    const status = uniqueStatuses[0];
    if (status === 'PENDING' || status === 'APPROVED' || status === 'REQUESTED' || status === 'PAID') {
      return status;
    }
    // NONEの場合は却下チェックが必要なのでnullを返す
    if (status === 'NONE') {
      return null;
    }
  }

  // 混在ステータス: 優先度順にチェック
  if (statuses.some(s => s === 'PAID')) return 'PAID';
  if (statuses.some(s => s === 'REQUESTED')) return 'REQUESTED';
  if (statuses.some(s => s === 'APPROVED')) return 'APPROVED';
  if (statuses.some(s => s === 'PENDING')) return 'PENDING';

  // すべてNONE → 却下チェックが必要
  return null;
}

// ============================================
// メイン関数
// ============================================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 月次セッション一覧を取得
 */
export async function getMonthlySessions(
  input: GetMonthlySessionsInput
): Promise<GetMonthlySessionsResult> {
  const { workerId, year, month } = input;

  // 月の開始・終了日
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  // 月内のタイムスタンプを取得
  const timestamps = await queryTimescale<TimestampRow>(
    `SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus"
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp >= $2
      AND timestamp < $3
    ORDER BY timestamp ASC`,
    [workerId, monthStart, monthEnd]
  );

  if (timestamps.length === 0) {
    return { sessions: [], year, month };
  }

  // セッションに分割
  const rawSessions = extractSessions(timestamps);

  // 全タイムスタンプIDを収集（却下チェック用）
  const allNoneTimestampIds = timestamps
    .filter(ts => !ts.applicationStatus || ts.applicationStatus === 'NONE')
    .map(ts => ts.id);

  // NONEステータスのタイムスタンプがある場合、却下申請を一括検索
  const rejectedApplications = allNoneTimestampIds.length > 0
    ? await findRejectedApplicationsByTimestampIds(workerId, allNoneTimestampIds)
    : [];

  // timestampId → 最新の却下申請のマッピングを構築
  const timestampToRejectionMap = new Map<string, {
    applicationId: string;
    rejectionReason: string | null;
    rejectionCategory: string | null;
  }>();

  for (const app of rejectedApplications) {
    for (const timestampId of app.timestampIds) {
      // 最初にマッチしたものが最新（rejectedAt DESC でソート済み）
      if (!timestampToRejectionMap.has(timestampId)) {
        timestampToRejectionMap.set(timestampId, {
          applicationId: app.id,
          rejectionReason: app.rejectionReason,
          rejectionCategory: app.rejectionCategory,
        });
      }
    }
  }

  // セッションを構築
  const sessions: MonthlySession[] = rawSessions.map(raw => {
    const duration = calculateDuration(raw.timestamps);
    const timestampIds = raw.timestamps.map(ts => ts.id);

    let status = resolveSessionStatus(raw.timestamps, raw.isComplete);
    let rejectedApplicationId: string | null = null;
    let rejectionReason: string | null = null;
    let rejectionCategory: string | null = null;

    // status が null の場合はNONEの打刻 → 却下チェック
    if (status === null) {
      // セッション内のタイムスタンプで却下申請に含まれるものを探す
      const rejection = findSessionRejection(timestampIds, timestampToRejectionMap);
      if (rejection) {
        status = 'REJECTED';
        rejectedApplicationId = rejection.applicationId;
        rejectionReason = rejection.rejectionReason;
        rejectionCategory = rejection.rejectionCategory;
      } else {
        status = 'NONE';
      }
    }

    return {
      date: formatDate(raw.startTime),
      startTime: raw.startTime.toISOString(),
      endTime: raw.endTime?.toISOString() ?? null,
      timestampIds,
      workMinutes: duration.workMinutes,
      restMinutes: duration.restMinutes,
      status,
      rejectedApplicationId,
      rejectionReason,
      rejectionCategory,
    };
  });

  return { sessions, year, month };
}

/**
 * セッションのタイムスタンプIDから却下情報を検索
 *
 * セッション内のすべてのタイムスタンプが同一の却下申請に含まれる場合のみ
 * 「却下」として扱う
 */
function findSessionRejection(
  timestampIds: string[],
  rejectionMap: Map<string, { applicationId: string; rejectionReason: string | null; rejectionCategory: string | null }>
): { applicationId: string; rejectionReason: string | null; rejectionCategory: string | null } | null {
  if (timestampIds.length === 0) return null;

  const firstRejection = rejectionMap.get(timestampIds[0]);
  if (!firstRejection) return null;

  // 全タイムスタンプが同じ却下申請に属するかチェック
  const allSameApplication = timestampIds.every(id => {
    const rejection = rejectionMap.get(id);
    return rejection && rejection.applicationId === firstRejection.applicationId;
  });

  return allSameApplication ? firstRejection : null;
}
