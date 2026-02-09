'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button, Alert } from '@/components/ui';
import type { DeleteTimestampInput, DeleteTimestampResult } from '../action/timestamp-actions';

type Timestamp = {
  id: string;
  timestamp: string;
  status: string;
  applicationStatus: string | null;
  memo: string | null;
};

type DeleteConfirmModalProps = {
  isOpen: boolean;
  timestamp: Timestamp | null;
  allTimestamps: Timestamp[];
  onClose: () => void;
  onDelete: (data: DeleteTimestampInput) => Promise<DeleteTimestampResult>;
  onDeleted?: () => void;
};

export function DeleteConfirmModal({
  isOpen,
  timestamp,
  allTimestamps,
  onClose,
  onDelete,
  onDeleted,
}: DeleteConfirmModalProps): React.JSX.Element | null {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabels = useMemo(() => ({
    WORK: t('timestamps.workDesc'),
    REST: t('timestamps.restDesc'),
    END: t('timestamps.endDesc'),
  }), [t]);

  // 削除するとEND→END連続になるかチェック
  const wouldCreateConsecutiveEnds = useMemo(() => {
    if (!timestamp) return false;

    // 削除対象を除いた打刻をソート
    const otherTimestamps = allTimestamps
      .filter(ts => ts.id !== timestamp.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 削除対象の位置を特定
    const targetTime = new Date(timestamp.timestamp).getTime();

    // 直前と直後の打刻を見つける
    let prevTimestamp: Timestamp | null = null;
    let nextTimestamp: Timestamp | null = null;

    for (let i = 0; i < otherTimestamps.length; i++) {
      const tsTime = new Date(otherTimestamps[i].timestamp).getTime();
      if (tsTime < targetTime) {
        prevTimestamp = otherTimestamps[i];
      } else {
        nextTimestamp = otherTimestamps[i];
        break;
      }
    }

    // 直前と直後の両方がENDなら、削除によって連続ENDになる
    if (prevTimestamp?.status === 'END' && nextTimestamp?.status === 'END') {
      return true;
    }

    return false;
  }, [timestamp, allTimestamps]);

  const handleDelete = async () => {
    if (!timestamp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onDelete({ id: timestamp.id });

      if (result.success) {
        onDeleted?.();
        onClose();
      } else {
        setError(result.error || t('timestamps.delete.deleteFailed'));
      }
    } catch (err) {
      console.error('Delete timestamp error:', err);
      setError(t('timestamps.delete.deleteFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestampStr: string): string => {
    const date = new Date(timestampStr);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!timestamp) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <h2 className="text-xl font-semibold">{t('timestamps.delete.title')}</h2>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        {wouldCreateConsecutiveEnds && (
          <Alert variant="warning" className="mb-4">
            {t('timestamps.delete.consecutiveEndWarning')}
          </Alert>
        )}
        <div className="space-y-4">
          <p className="text-gray-700">{t('timestamps.delete.confirmMessage')}</p>
          <div className="bg-gray-50 p-4 rounded-md">
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-24 text-gray-500">{t('common.time')}:</dt>
                <dd className="font-medium">{formatTime(timestamp.timestamp)}</dd>
              </div>
              <div className="flex">
                <dt className="w-24 text-gray-500">{t('common.status')}:</dt>
                <dd className="font-medium">
                  {statusLabels[timestamp.status as keyof typeof statusLabels] || timestamp.status}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-sm text-red-600">
            {t('timestamps.delete.irreversibleWarning')}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={isLoading}
          disabled={wouldCreateConsecutiveEnds}
        >
          {t('common.delete')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
