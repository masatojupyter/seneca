'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Table, Badge, Button, Alert } from '@/components/ui';
import { EditTimestampModal } from './EditTimestampModal';
import type { TimestampItem } from '../action/timesheet-actions';

type TimestampTableProps = {
  timestamps: TimestampItem[];
  onUpdate: (id: string, data: { status?: string; timestamp?: string; memo?: string }) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
};

export function TimestampTable({ timestamps, onUpdate, onDelete, onRefresh }: TimestampTableProps): React.JSX.Element {
  const t = useTranslations();
  const [editingTimestamp, setEditingTimestamp] = useState<TimestampItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const statusConfig = useMemo(() => ({
    WORK: { label: t('timestamps.work'), variant: 'success' as const },
    END: { label: t('timestamps.end'), variant: 'danger' as const },
    REST: { label: t('timestamps.rest'), variant: 'warning' as const },
  }), [t]);

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('timestamps.delete.confirmMessage'))) {
      return;
    }

    setDeletingId(id);
    setError('');

    try {
      const result = await onDelete(id);
      if (result.success) {
        setSuccess(t('timestamps.delete.deleteSuccess'));
        setTimeout(() => setSuccess(''), 3000);
        onRefresh();
      } else {
        setError(result.error || t('timestamps.delete.deleteFailed'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateSubmit = async (data: { status?: string; timestamp?: string; memo?: string }) => {
    if (!editingTimestamp) return;

    setError('');
    const result = await onUpdate(editingTimestamp.id, data);

    if (result.success) {
      setSuccess(t('timestamps.edit.updateSuccess'));
      setTimeout(() => setSuccess(''), 3000);
      setEditingTimestamp(null);
      onRefresh();
    } else {
      setError(result.error || t('timestamps.edit.updateFailed'));
    }
  };

  // 日付ごとにグループ化
  const groupedTimestamps = timestamps.reduce((acc, ts) => {
    const date = formatDate(ts.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(ts);
    return acc;
  }, {} as Record<string, TimestampItem[]>);

  if (timestamps.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('timesheet.noHistory')}
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="space-y-6">
        {Object.entries(groupedTimestamps).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">{date}</h3>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{t('common.time')}</Table.Head>
                  <Table.Head>{t('timestamps.timestampStatus')}</Table.Head>
                  <Table.Head>{t('timestamps.applicationStatus')}</Table.Head>
                  <Table.Head>{t('common.memo')}</Table.Head>
                  <Table.Head>{t('common.actions')}</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((ts) => (
                  <Table.Row key={ts.id}>
                    <Table.Cell>{formatDateTime(ts.timestamp)}</Table.Cell>
                    <Table.Cell>{getStatusBadge(ts.status)}</Table.Cell>
                    <Table.Cell>{ts.applicationStatus || 'NONE'}</Table.Cell>
                    <Table.Cell className="max-w-xs truncate">{ts.memo || '-'}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingTimestamp(ts)}
                          disabled={ts.applicationStatus !== null && ts.applicationStatus !== 'NONE'}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(ts.id)}
                          disabled={deletingId === ts.id || (ts.applicationStatus !== null && ts.applicationStatus !== 'NONE')}
                          isLoading={deletingId === ts.id}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ))}
      </div>

      {editingTimestamp && (
        <EditTimestampModal
          timestamp={editingTimestamp}
          onClose={() => setEditingTimestamp(null)}
          onSubmit={handleUpdateSubmit}
        />
      )}
    </>
  );
}
