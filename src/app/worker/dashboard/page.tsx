'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, Loading } from '@/components/ui';
import {
  TimestampButtons,
  TodayTimestampList,
  TodayEditHistoryList,
  EditTimestampModal,
  DeleteConfirmModal,
  WorkTimer,
  TodaySummary,
  AvailableBalance,
  DateNavigator,
  createTimestampAction,
  getTodaySummaryAction,
  getAvailableBalanceAction,
  getTimestampsByDateAction,
  getEditHistoryByDateAction,
  updateTimestampAction,
  deleteTimestampAction,
} from '@/lib/client/features/worker-dashboard';
import type { CurrentWorkStatus, TimestampData } from '@/lib/client/features/worker-dashboard';

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function parseInitialDate(dateParam: string | null): Date {
  if (!dateParam) return new Date();
  const parsed = new Date(dateParam + 'T00:00:00');
  if (isNaN(parsed.getTime())) return new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed > today ? today : parsed;
}

export default function WorkerDashboardPage(): React.JSX.Element {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [timestamps, setTimestamps] = useState<TimestampData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTimestamp, setEditingTimestamp] = useState<TimestampData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingTimestamp, setDeletingTimestamp] = useState<TimestampData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<CurrentWorkStatus>('NOT_STARTED');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseInitialDate(searchParams.get('date'))
  );

  const dateString = useMemo(() => toDateString(selectedDate), [selectedDate]);

  const isToday = useMemo(() => {
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    );
  }, [selectedDate]);

  const dateLabel = useMemo(
    () => (isToday ? t('common.today') : formatDateLabel(selectedDate)),
    [isToday, selectedDate, t]
  );

  const handleEditClick = useCallback((timestamp: TimestampData): void => {
    setEditingTimestamp(timestamp);
    setIsEditModalOpen(true);
  }, []);

  const handleEditModalClose = useCallback((): void => {
    setIsEditModalOpen(false);
    setEditingTimestamp(null);
  }, []);

  const handleDeleteClick = useCallback((timestamp: TimestampData): void => {
    setDeletingTimestamp(timestamp);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteModalClose = useCallback((): void => {
    setIsDeleteModalOpen(false);
    setDeletingTimestamp(null);
  }, []);

  const loadTimestamps = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTimestampsByDateAction(dateString);
      if (result.success && result.timestamps) {
        setTimestamps(result.timestamps);
      }
    } catch (error) {
      console.error('Load timestamps error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateString]);

  const handleTimestampCreated = useCallback((): void => {
    loadTimestamps();
    setRefreshTrigger((prev) => prev + 1);
  }, [loadTimestamps]);

  useEffect(() => {
    loadTimestamps();
  }, [loadTimestamps]);

  const getEditHistory = useCallback(
    () => getEditHistoryByDateAction(dateString),
    [dateString]
  );

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('worker.dashboard.title')}</h1>
        <p className="text-gray-600 mt-1">{t('worker.dashboard.subtitle')}</p>
      </div>

      {isToday && (
        <>
          <WorkTimer timestamps={timestamps} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodaySummary
              onGetSummary={getTodaySummaryAction}
              onStatusChange={setCurrentStatus}
              refreshTrigger={refreshTrigger}
            />
            <AvailableBalance onGetBalance={getAvailableBalanceAction} />
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">{t('worker.dashboard.timestamp')}</h2>
            </Card.Header>
            <Card.Body>
              <TimestampButtons
                onCreateTimestamp={createTimestampAction}
                onTimestampCreated={handleTimestampCreated}
                currentStatus={currentStatus}
              />
            </Card.Body>
          </Card>
        </>
      )}

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('worker.dashboard.timestampHistory')}</h2>
          <div className="mt-3">
            <DateNavigator
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : (
            <TodayTimestampList
              timestamps={timestamps}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onRefresh={handleTimestampCreated}
            />
          )}
        </Card.Body>
      </Card>

      <TodayEditHistoryList
        onGetEditHistory={getEditHistory}
        refreshTrigger={refreshTrigger}
        dateLabel={dateLabel}
      />

      <EditTimestampModal
        isOpen={isEditModalOpen}
        timestamp={editingTimestamp}
        allTimestamps={timestamps}
        onClose={handleEditModalClose}
        onUpdate={updateTimestampAction}
        onUpdated={handleTimestampCreated}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        timestamp={deletingTimestamp}
        allTimestamps={timestamps}
        onClose={handleDeleteModalClose}
        onDelete={deleteTimestampAction}
        onDeleted={handleTimestampCreated}
      />
    </div>
  );
}
