'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Button, Select, Input, Textarea } from '@/components/ui';
import type { TimestampItem } from '../action/timesheet-actions';
import type { SelectOption } from '@/components/ui';

type EditTimestampModalProps = {
  timestamp: TimestampItem;
  onClose: () => void;
  onSubmit: (data: { status?: string; timestamp?: string; memo?: string }) => Promise<void>;
};

export function EditTimestampModal({ timestamp, onClose, onSubmit }: EditTimestampModalProps): React.JSX.Element {
  const t = useTranslations();
  const [status, setStatus] = useState(timestamp.status);
  const [timestampValue, setTimestampValue] = useState(() => {
    const date = new Date(timestamp.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [memo, setMemo] = useState(timestamp.memo || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions: SelectOption[] = useMemo(() => [
    { value: 'WORK', label: t('timestamps.work') },
    { value: 'END', label: t('timestamps.end') },
    { value: 'REST', label: t('timestamps.rest') },
  ], [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // datetime-local形式からISO文字列に変換
      const date = new Date(timestampValue);
      const isoTimestamp = date.toISOString();

      await onSubmit({
        status: status !== timestamp.status ? status : undefined,
        timestamp: isoTimestamp !== timestamp.timestamp ? isoTimestamp : undefined,
        memo: memo !== (timestamp.memo || '') ? memo : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <h2 className="text-xl font-semibold">{t('timestamps.edit.title')}</h2>
        </Modal.Header>

        <Modal.Body>
          <div className="space-y-4">
            <Select
              label={t('timestamps.edit.statusLabel')}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              required
            />

            <Input
              label={`${t('timestamps.edit.dateLabel')} / ${t('timestamps.edit.timeLabel')}`}
              type="datetime-local"
              value={timestampValue}
              onChange={(e) => setTimestampValue(e.target.value)}
              required
            />

            <Textarea
              label={t('timestamps.edit.memoLabel')}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t('timestamps.edit.memoPlaceholder')}
              rows={3}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {t('common.update')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
