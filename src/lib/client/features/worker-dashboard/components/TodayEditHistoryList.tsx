'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Table, Loading, Badge, Button } from '@/components/ui';
import type { TodayEditHistoryResult, TimestampEditHistoryData } from '../action/timestamp-actions';

type TodayEditHistoryListProps = {
  onGetEditHistory: () => Promise<TodayEditHistoryResult>;
  refreshTrigger?: number;
  dateLabel?: string;
};

export function TodayEditHistoryList({
  onGetEditHistory,
  refreshTrigger,
  dateLabel,
}: TodayEditHistoryListProps): React.JSX.Element {
  const t = useTranslations();
  const [history, setHistory] = useState<TimestampEditHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const statusLabels = useMemo(() => ({
    WORK: t('timestamps.work'),
    END: t('timestamps.end'),
    REST: t('timestamps.rest'),
    DELETED: t('common.deleted'),
  }), [t]);

  const fieldNameLabels = useMemo(() => ({
    status: t('common.status'),
    timestamp: t('editHistory.timestampTime'),
    memo: t('common.memo'),
  }), [t]);

  // refでコールバックを保持し、effectの依存を安定化させる
  const onGetEditHistoryRef = useRef(onGetEditHistory);
  onGetEditHistoryRef.current = onGetEditHistory;

  const loadHistory = useCallback(async () => {
    try {
      const result = await onGetEditHistoryRef.current();
      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error('Load edit history error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshTrigger]);

  const formatDateTime = (timestamp: string): { date: string; time: string } => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return {
      date: `${year}/${month}/${day}`,
      time: `${hours}:${minutes}`,
    };
  };

  const formatTimeShort = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldNameLabels[fieldName as keyof typeof fieldNameLabels] || fieldName;
  };

  const formatValue = (fieldName: string, value: string | null): string => {
    if (value === null) {
      return '-';
    }

    if (fieldName === 'status') {
      return statusLabels[value as keyof typeof statusLabels] || value;
    }

    if (fieldName === 'timestamp') {
      if (value === 'DELETED') {
        return t('common.deleted');
      }
      const date = new Date(value);
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    return value;
  };

  const isDeleteRecord = (h: TimestampEditHistoryData): boolean => {
    return h.fieldName === 'status' && h.newValue === 'DELETED';
  };

  const isTimestampDeleteRecord = (h: TimestampEditHistoryData): boolean => {
    return h.fieldName === 'timestamp' && h.newValue === 'DELETED';
  };

  const isNewTimestampRecord = (h: TimestampEditHistoryData): boolean => {
    return h.fieldName === 'status' && h.oldValue === null;
  };

  const getTargetTimestampInfo = (h: TimestampEditHistoryData): string => {
    // 削除された打刻の場合、oldValueから時刻を取得
    if (isDeleteRecord(h) || isTimestampDeleteRecord(h)) {
      if (h.fieldName === 'timestamp' && h.oldValue) {
        return formatTimeShort(h.oldValue);
      }
      return t('common.deleted');
    }

    // 現存する打刻の場合
    if (h.originalTimestamp) {
      return formatTimeShort(h.originalTimestamp);
    }

    // 時刻変更の場合はoldValueから取得
    if (h.fieldName === 'timestamp' && h.oldValue) {
      return formatTimeShort(h.oldValue);
    }

    return '-';
  };

  const getTargetStatusInfo = (h: TimestampEditHistoryData): string => {
    // 削除記録の場合
    if (isDeleteRecord(h)) {
      return statusLabels[h.oldValue as keyof typeof statusLabels] || h.oldValue || '-';
    }

    // ステータス変更の場合
    if (h.fieldName === 'status' && h.oldValue) {
      return statusLabels[h.oldValue as keyof typeof statusLabels] || h.oldValue;
    }

    // 現存する打刻の場合
    if (h.originalStatus) {
      return statusLabels[h.originalStatus as keyof typeof statusLabels] || h.originalStatus;
    }

    return '-';
  };

  // 削除時のtimestampレコードはスキップ（statusレコードで表示するため）
  const filteredHistory = history.filter((h) => !isTimestampDeleteRecord(h));

  const toggleVisibility = (): void => {
    setIsVisible((prev) => !prev);
  };

  const title = dateLabel ? t('editHistory.titleWithDate', { date: dateLabel }) : t('editHistory.title');

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{title}</h2>
            <Button variant="secondary" size="sm" onClick={toggleVisibility}>
              {isVisible ? t('common.hide') : t('common.show')}
            </Button>
          </div>
        </Card.Header>
        {isVisible && (
          <Card.Body>
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          </Card.Body>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="secondary" size="sm" onClick={toggleVisibility}>
            {isVisible ? t('common.hide') : t('common.show')}
          </Button>
        </div>
      </Card.Header>
      {isVisible && (
        <Card.Body>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('editHistory.empty')}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t('editHistory.changeDate')}</Table.Head>
                <Table.Head>{t('editHistory.targetTimestamp')}</Table.Head>
                <Table.Head>{t('editHistory.operation')}</Table.Head>
                <Table.Head>{t('editHistory.before')}</Table.Head>
                <Table.Head>{t('editHistory.after')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredHistory.map((h) => (
                <Table.Row key={h.id} className={isDeleteRecord(h) ? 'bg-red-50' : ''}>
                  <Table.Cell className="text-gray-600 text-sm">
                    {formatDateTime(h.changedAt).date} {formatDateTime(h.changedAt).time}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{getTargetTimestampInfo(h)}</span>
                      <span className="text-xs text-gray-500">{getTargetStatusInfo(h)}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {isDeleteRecord(h) ? (
                      <Badge variant="danger">{t('editHistory.delete')}</Badge>
                    ) : isNewTimestampRecord(h) ? (
                      <Badge variant="success">{t('editHistory.newTimestamp')}</Badge>
                    ) : (
                      <Badge variant="info">{formatFieldName(h.fieldName)} {t('editHistory.change')}</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-gray-500">
                    {formatValue(h.fieldName, h.oldValue)}
                  </Table.Cell>
                  <Table.Cell className={isDeleteRecord(h) ? 'text-red-600 font-medium' : 'text-blue-600 font-medium'}>
                    {formatValue(h.fieldName, h.newValue)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        </Card.Body>
      )}
    </Card>
  );
}
