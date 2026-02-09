'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Table, Badge, Button, Alert } from '@/components/ui';
import {
  createApplicationAction,
  cancelApplicationAction,
} from '@/lib/client/features/time-application';
import { updateTimestampMemoAction } from '../action/timestamp-actions';
import type { TimestampData } from '../action/timestamp-actions';

type TodayTimestampListProps = {
  timestamps: TimestampData[];
  onEdit?: (timestamp: TimestampData) => void;
  onDelete?: (timestamp: TimestampData) => void;
  onRefresh?: () => void;
};

// セッション情報を抽出するヘルパー
type SessionInfo = {
  timestamps: TimestampData[];
  isComplete: boolean;
  canApply: boolean;
  startTime: Date;
  endTime: Date | null;
  rejectedApplicationId: string | null;
  rejectionReason: string | null;
};

/**
 * セッションを抽出
 *
 * ロジック:
 * - 各ENDに対して、直前のENDの次の打刻からそのENDまでをセッションとする
 * - 直前のENDがなければ、最初の打刻からそのENDまでをセッションとする
 * - セッションの最初がWORKでなければ申請不可
 * - すべての打刻が未申請でなければ申請不可
 *
 * 例: [Work, Rest, Work, End, Work, End, Work, End] の場合
 * - 1番目のEnd: [Work, Rest, Work, End]
 * - 2番目のEnd: [Work, End]（1番目のEndの直後から）
 * - 3番目のEnd: [Work, End]（2番目のEndの直後から）
 */
function extractSessions(timestamps: TimestampData[]): SessionInfo[] {
  const sessions: SessionInfo[] = [];

  // 全打刻を時系列順にソート（isPending含む）
  const sorted = [...timestamps].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // 各ENDに対してセッションを抽出
  for (let i = 0; i < sorted.length; i++) {
    const ts = sorted[i];

    if (ts.status === 'END') {
      // このENDより前の、直近のENDを探す（申請状態に関係なく）
      let prevEndIndex = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (sorted[j].status === 'END') {
          prevEndIndex = j;
          break;
        }
      }

      // セッションの打刻を抽出（直前のENDの次から現在のENDまで）
      const startIndex = prevEndIndex + 1;
      const sessionTimestamps = sorted.slice(startIndex, i + 1);

      if (sessionTimestamps.length === 0) {
        continue;
      }

      // セッションの最初がWORKかどうか
      const startsWithWork = sessionTimestamps[0].status === 'WORK';

      // すべて未申請かどうか
      const allNone = sessionTimestamps.every(
        t => t.applicationStatus === 'NONE' || t.applicationStatus === null
      );

      // 申請可能条件: WORKで始まり、すべて未申請
      const canApply = startsWithWork && allNone;

      // 却下情報を取得（セッション内の最初のタイムスタンプから）
      const rejectedTs = sessionTimestamps.find(t => t.rejectedApplicationId);

      sessions.push({
        timestamps: sessionTimestamps,
        isComplete: true,
        canApply,
        startTime: new Date(sessionTimestamps[0].timestamp),
        endTime: new Date(ts.timestamp),
        rejectedApplicationId: rejectedTs?.rejectedApplicationId ?? null,
        rejectionReason: rejectedTs?.rejectionReason ?? null,
      });
    }
  }

  // 未完結のセッション（ENDで終わっていない）を追加
  // 最後のENDの次の打刻から、最後の打刻まで
  if (sorted.length > 0) {
    const lastTimestamp = sorted[sorted.length - 1];
    if (lastTimestamp.status !== 'END') {
      // 最後のENDを探す（申請状態に関係なく）
      let lastEndIndex = -1;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i].status === 'END') {
          lastEndIndex = i;
          break;
        }
      }

      const startIndex = lastEndIndex + 1;
      const remainingTimestamps = sorted.slice(startIndex);

      if (remainingTimestamps.length > 0 && remainingTimestamps[remainingTimestamps.length - 1].status !== 'END') {
        sessions.push({
          timestamps: remainingTimestamps,
          isComplete: false,
          canApply: false,
          startTime: new Date(remainingTimestamps[0].timestamp),
          endTime: null,
          rejectedApplicationId: null,
          rejectionReason: null,
        });
      }
    }
  }

  return sessions;
}

const MEMO_MAX_LENGTH = 500;

function MemoCell({
  timestampId,
  initialMemo,
  isEditable,
  placeholder,
}: {
  timestampId: string;
  initialMemo: string | null;
  isEditable: boolean;
  placeholder: string;
}): React.JSX.Element {
  const [value, setValue] = useState(initialMemo || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedValue, setSavedValue] = useState(initialMemo || '');

  const handleBlur = useCallback(async () => {
    const trimmed = value.trim();
    if (trimmed === savedValue) return;

    setIsSaving(true);
    try {
      const result = await updateTimestampMemoAction({ id: timestampId, memo: trimmed });
      if (result.success) {
        setSavedValue(trimmed);
        setValue(trimmed);
      }
    } catch {
      setValue(savedValue);
    } finally {
      setIsSaving(false);
    }
  }, [timestampId, value, savedValue]);

  if (!isEditable) {
    return (
      <span className="text-sm text-gray-600 whitespace-pre-wrap break-all">
        {initialMemo || '-'}
      </span>
    );
  }

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isSaving}
        maxLength={MEMO_MAX_LENGTH}
        placeholder={placeholder}
        style={{ width: 'calc(100% - 1.25rem)' }}
        className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:bg-gray-50"
      />
    </div>
  );
}

export function TodayTimestampList({ timestamps, onEdit, onDelete, onRefresh }: TodayTimestampListProps): React.JSX.Element {
  const t = useTranslations();
  const sessions = useMemo(() => extractSessions(timestamps), [timestamps]);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const statusBadgeConfig = useMemo(() => ({
    WORK: { label: t('timestamps.work'), variant: 'success' as const },
    END: { label: t('timestamps.end'), variant: 'danger' as const },
    REST: { label: t('timestamps.rest'), variant: 'warning' as const },
  }), [t]);

  const applicationStatusConfig = useMemo(() => ({
    NONE: { label: '-', variant: 'default' as const },
    PENDING: { label: t('timestampList.approvalPending'), variant: 'warning' as const },
    APPROVED: { label: t('timestampList.approved'), variant: 'success' as const },
    REQUESTED: { label: t('timestampList.paymentPending'), variant: 'info' as const },
    PAID: { label: t('timestampList.paid'), variant: 'success' as const },
  }), [t]);

  const handleApply = async (session: SessionInfo) => {
    const sessionId = session.timestamps[0].id;
    setLoadingSessionId(sessionId);
    setNotification(null);

    try {
      const timestamps = session.timestamps.map(ts => new Date(ts.timestamp));
      const startDate = new Date(Math.min(...timestamps.map(d => d.getTime())));
      const endDate = new Date(Math.max(...timestamps.map(d => d.getTime())));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const result = await createApplicationAction({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timestampIds: session.timestamps.map(ts => ts.id),
        originalApplicationId: session.rejectedApplicationId ?? undefined,
      });

      if (result.success) {
        setNotification({ type: 'success', message: t('sessions.applicationCreated') });
        onRefresh?.();
      } else {
        setNotification({ type: 'error', message: result.error || t('sessions.applicationFailed') });
      }
    } catch {
      setNotification({ type: 'error', message: t('common.unexpectedError') });
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleCancel = async (applicationId: string) => {
    if (!confirm(t('sessions.cancelConfirm'))) {
      return;
    }

    setLoadingSessionId(applicationId);
    setNotification(null);

    try {
      const result = await cancelApplicationAction(applicationId);

      if (result.success) {
        setNotification({ type: 'success', message: t('sessions.applicationCancelled') });
        onRefresh?.();
      } else {
        setNotification({ type: 'error', message: result.error || t('sessions.cancelFailed') });
      }
    } catch {
      setNotification({ type: 'error', message: t('common.unexpectedError') });
    } finally {
      setLoadingSessionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusBadgeConfig[status as keyof typeof statusBadgeConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getApplicationStatusCell = (ts: TimestampData, session: SessionInfo | undefined) => {
    const appStatus = ts.applicationStatus || 'NONE';
    const sessionId = session?.timestamps[0]?.id;
    const isLoading = loadingSessionId !== null &&
                      (loadingSessionId === sessionId || loadingSessionId === ts.applicationId);

    // END の行で、セッションが完結していて申請可能な場合にボタンを表示
    if (ts.status === 'END' && session?.isComplete && session?.canApply) {
      const isReapply = session.rejectedApplicationId !== null;
      return (
        <div className="space-y-1">
          <Button
            variant={isReapply ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => handleApply(session)}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isReapply ? t('sessions.reapply') : t('sessions.apply')}
          </Button>
          {isReapply && session.rejectionReason && (
            <p className="text-xs text-red-600">{t('sessions.rejectionReason', { reason: session.rejectionReason })}</p>
          )}
        </div>
      );
    }

    // PENDING状態でENDの場合は申請取消ボタンを表示
    if (ts.status === 'END' && appStatus === 'PENDING' && ts.applicationId) {
      return (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleCancel(ts.applicationId!)}
          disabled={isLoading}
          isLoading={isLoading}
        >
          {t('sessions.cancelApplication')}
        </Button>
      );
    }

    // その他のステータス表示
    const config = applicationStatusConfig[appStatus as keyof typeof applicationStatusConfig] || { label: appStatus, variant: 'default' as const };

    if (config.label === '-') {
      return <span className="text-gray-400">-</span>;
    }

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (timestamp: string, isPending?: boolean) => {
    const date = new Date(timestamp);
    if (isPending) {
      // 未終了打刻は日付も表示
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const time = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return `${month}/${day} ${time}`;
    }
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (timestamps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('timestamps.noTimestamps')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notification && (
        <Alert
          variant={notification.type}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}
      <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head className="w-20"></Table.Head>
          <Table.Head>{t('common.time')}</Table.Head>
          <Table.Head>{t('timestamps.timestampStatus')}</Table.Head>
          <Table.Head>{t('common.memo')}</Table.Head>
          <Table.Head>{t('timestamps.applicationStatus')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {timestamps.map((ts) => {
          // このタイムスタンプが属するセッションを検索
          const session = sessions.find(s => s.timestamps.some(t => t.id === ts.id));
          return (
            <Table.Row
              key={ts.id}
              className={ts.isPending ? 'bg-orange-50 border-l-4 border-l-orange-400' : ''}
            >
              <Table.Cell>
                  {(!ts.applicationStatus || ts.applicationStatus === 'NONE') && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(ts)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {t('common.delete')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(ts)}
                      >
                        {t('common.edit')}
                      </Button>
                    </div>
                  )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  {formatTime(ts.timestamp, ts.isPending)}
                  {ts.isPending && (
                    <Badge variant="warning">{t('timestampList.notEnded')}</Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>{getStatusBadge(ts.status)}</Table.Cell>
              <Table.Cell>
                <MemoCell
                  timestampId={ts.id}
                  initialMemo={ts.memo}
                  isEditable={!ts.applicationStatus || ts.applicationStatus === 'NONE'}
                  placeholder={t('sessions.memoPlaceholder')}
                />
              </Table.Cell>
              <Table.Cell>{getApplicationStatusCell(ts, session)}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
    </div>
  );
}
