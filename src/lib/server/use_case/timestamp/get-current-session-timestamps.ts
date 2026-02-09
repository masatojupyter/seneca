import { queryTimescale } from '@/lib/server/infra/timescale';

type WorkTimestamp = {
  id: string;
  workerId: string;
  timestamp: Date;
  status: 'WORK' | 'REST' | 'END';
  applicationStatus: string | null;
  memo: string | null;
};

type SessionTimestampsResult = {
  timestamps: WorkTimestamp[];
  previousEndTimestamp: Date | null;
  hasWork: boolean;
  isComplete: boolean;
};

/**
 * 現在のセッション（直近のEND以降）の打刻を取得
 *
 * ロジック:
 * 1. 全打刻を時系列で取得
 * 2. 最新のENDを探す
 * 3. そのENDの直後のWORKから、次のENDまでを返す
 *
 * 申請可能条件:
 * - WORKで始まる
 * - ENDで終わる
 * - 未申請（applicationStatus が NONE または null）
 */
export async function getCurrentSessionTimestamps(
  workerId: string
): Promise<SessionTimestampsResult> {
  // 過去30日分の打刻を取得（十分な範囲）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allTimestamps = await queryTimescale<WorkTimestamp>(
    `SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp >= $2
    ORDER BY timestamp ASC`,
    [workerId, thirtyDaysAgo]
  );

  if (allTimestamps.length === 0) {
    return {
      timestamps: [],
      previousEndTimestamp: null,
      hasWork: false,
      isComplete: false,
    };
  }

  // 最新のENDのインデックスを探す（後ろから検索）
  let lastEndIndex = -1;
  for (let i = allTimestamps.length - 1; i >= 0; i--) {
    if (allTimestamps[i].status === 'END') {
      // このENDが申請済みかどうかを確認
      const appStatus = allTimestamps[i].applicationStatus;
      if (appStatus && appStatus !== 'NONE') {
        // 申請済みのEND = 前のセッションの終了
        lastEndIndex = i;
        break;
      }
      // 未申請のEND = 現在のセッションの終了
      // このENDの前のENDを探し続ける
    }
  }

  // 現在のセッションの打刻を抽出
  // lastEndIndex === -1 の場合は全ての打刻が対象
  // lastEndIndex >= 0 の場合はその次の打刻から
  const startIndex = lastEndIndex + 1;
  const sessionTimestamps = allTimestamps.slice(startIndex);

  // セッションの最初がWORKかどうかを確認
  const hasWork = sessionTimestamps.length > 0 && sessionTimestamps[0].status === 'WORK';

  // セッションの最後がENDかどうかを確認
  const isComplete = sessionTimestamps.length > 0 &&
    sessionTimestamps[sessionTimestamps.length - 1].status === 'END';

  // 前のENDの時刻
  const previousEndTimestamp = lastEndIndex >= 0
    ? allTimestamps[lastEndIndex].timestamp
    : null;

  return {
    timestamps: sessionTimestamps,
    previousEndTimestamp,
    hasWork,
    isComplete,
  };
}

/**
 * 指定したENDの打刻に対応するセッションの打刻を取得
 *
 * @param workerId 従業員ID
 * @param endTimestampId ENDの打刻ID
 */
export async function getSessionTimestampsForEnd(
  workerId: string,
  endTimestampId: string
): Promise<SessionTimestampsResult> {
  // 過去30日分の打刻を取得
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allTimestamps = await queryTimescale<WorkTimestamp>(
    `SELECT
      id,
      worker_id as "workerId",
      timestamp,
      status,
      application_status as "applicationStatus",
      memo
    FROM work_timestamps
    WHERE worker_id = $1
      AND timestamp >= $2
    ORDER BY timestamp ASC`,
    [workerId, thirtyDaysAgo]
  );

  if (allTimestamps.length === 0) {
    return {
      timestamps: [],
      previousEndTimestamp: null,
      hasWork: false,
      isComplete: false,
    };
  }

  // 指定されたENDのインデックスを探す
  const targetEndIndex = allTimestamps.findIndex(ts => ts.id === endTimestampId);
  if (targetEndIndex === -1 || allTimestamps[targetEndIndex].status !== 'END') {
    throw new Error('指定されたENDの打刻が見つかりません');
  }

  // そのENDより前の、直近の申請済みENDを探す
  let previousEndIndex = -1;
  for (let i = targetEndIndex - 1; i >= 0; i--) {
    if (allTimestamps[i].status === 'END') {
      const appStatus = allTimestamps[i].applicationStatus;
      if (appStatus && appStatus !== 'NONE') {
        previousEndIndex = i;
        break;
      }
    }
  }

  // セッションの打刻を抽出
  const startIndex = previousEndIndex + 1;
  const sessionTimestamps = allTimestamps.slice(startIndex, targetEndIndex + 1);

  // セッションの最初がWORKかどうかを確認
  const hasWork = sessionTimestamps.length > 0 && sessionTimestamps[0].status === 'WORK';

  // セッションの最後がENDかどうかを確認
  const isComplete = sessionTimestamps.length > 0 &&
    sessionTimestamps[sessionTimestamps.length - 1].status === 'END';

  // 前のENDの時刻
  const previousEndTimestamp = previousEndIndex >= 0
    ? allTimestamps[previousEndIndex].timestamp
    : null;

  return {
    timestamps: sessionTimestamps,
    previousEndTimestamp,
    hasWork,
    isComplete,
  };
}
