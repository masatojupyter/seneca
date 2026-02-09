'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button, Input, Select, Alert } from '@/components/ui';
import type { UpdateTimestampInput, UpdateTimestampResult } from '../action/timestamp-actions';

type Timestamp = {
  id: string;
  timestamp: string;
  status: string;
  applicationStatus: string | null;
  memo: string | null;
};

type EditTimestampModalProps = {
  isOpen: boolean;
  timestamp: Timestamp | null;
  allTimestamps: Timestamp[];
  onClose: () => void;
  onUpdate: (data: UpdateTimestampInput) => Promise<UpdateTimestampResult>;
  onUpdated?: () => void;
};

type TimestampStatus = 'WORK' | 'REST' | 'END';

export function EditTimestampModal({
  isOpen,
  timestamp,
  allTimestamps,
  onClose,
  onUpdate,
  onUpdated,
}: EditTimestampModalProps): React.JSX.Element | null {
  const t = useTranslations();
  const [date, setDate] = useState('');

  const statusOptions = useMemo(() => [
    { value: 'WORK', label: t('timestamps.workDesc') },
    { value: 'REST', label: t('timestamps.restDesc') },
    { value: 'END', label: t('timestamps.endDesc') },
  ], [t]);
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<TimestampStatus>('WORK');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (timestamp) {
      const dt = new Date(timestamp.timestamp);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');

      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
      setStatus(timestamp.status as TimestampStatus);
      setMemo(timestamp.memo || '');
      setError(null);
    }
  }, [timestamp]);

  // END→END連続チェック
  const wouldCreateConsecutiveEnds = useMemo(() => {
    if (!timestamp || status !== 'END') return false;

    // 新しい日時を計算
    const newDateTime = new Date(`${date}T${time}`);
    if (isNaN(newDateTime.getTime())) return false;

    // 全打刻をソート（編集対象を除く）
    const otherTimestamps = allTimestamps
      .filter(ts => ts.id !== timestamp.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // 新しい位置を計算
    const newTime = newDateTime.getTime();

    // 直前と直後の打刻を見つける
    let prevTimestamp: Timestamp | null = null;
    let nextTimestamp: Timestamp | null = null;

    for (let i = 0; i < otherTimestamps.length; i++) {
      const tsTime = new Date(otherTimestamps[i].timestamp).getTime();
      if (tsTime < newTime) {
        prevTimestamp = otherTimestamps[i];
      } else {
        nextTimestamp = otherTimestamps[i];
        break;
      }
    }

    // 直前または直後がENDなら連続END
    if (prevTimestamp?.status === 'END' || nextTimestamp?.status === 'END') {
      return true;
    }

    return false;
  }, [timestamp, status, date, time, allTimestamps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!timestamp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await onUpdate({
        id: timestamp.id,
        date,
        time,
        status,
        memo,
      });

      if (result.success) {
        onUpdated?.();
        onClose();
      } else {
        setError(result.error || t('timestamps.edit.updateFailed'));
      }
    } catch (err) {
      console.error('Update timestamp error:', err);
      setError(t('timestamps.edit.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!timestamp) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <h2 className="text-xl font-semibold">{t('timestamps.edit.title')}</h2>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          {wouldCreateConsecutiveEnds && (
            <Alert variant="warning" className="mb-4">
              {t('timestamps.edit.consecutiveEndWarning')}
            </Alert>
          )}
          <div className="space-y-4">
            <Input
              type="date"
              label={t('timestamps.edit.dateLabel')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              type="time"
              label={t('timestamps.edit.timeLabel')}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <Select
              label={t('timestamps.edit.statusLabel')}
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as TimestampStatus)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('timestamps.edit.memoLabel')}</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t('timestamps.edit.memoPlaceholder')}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
          <Button type="submit" isLoading={isLoading} disabled={wouldCreateConsecutiveEnds}>
            {t('common.save')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
