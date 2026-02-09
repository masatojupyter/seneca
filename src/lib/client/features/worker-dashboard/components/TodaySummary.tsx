'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading, Badge, Alert, Button } from '@/components/ui';
import type { TodaySummaryData, CurrentWorkStatus, PendingSession } from '../action/timestamp-actions';

type TodaySummaryProps = {
  onGetSummary: () => Promise<{ success: boolean; error?: string; summary?: TodaySummaryData }>;
  onStatusChange?: (status: CurrentWorkStatus) => void;
  onPendingSessionChange?: (pendingSession: PendingSession | null) => void;
  refreshTrigger?: number;
};

function formatPendingDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * Today's summary (work time, rest time, current status)
 */
export function TodaySummary({ onGetSummary, onStatusChange, onPendingSessionChange, refreshTrigger }: TodaySummaryProps): React.JSX.Element {
  const t = useTranslations();
  const [summary, setSummary] = useState<TodaySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const statusConfig = useMemo(() => ({
    NOT_STARTED: { label: t('todaySummary.status.notStarted'), variant: 'default' as const },
    WORKING: { label: t('todaySummary.status.working'), variant: 'success' as const },
    RESTING: { label: t('todaySummary.status.resting'), variant: 'warning' as const },
    ENDED: { label: t('todaySummary.status.ended'), variant: 'info' as const },
  }), [t]);

  const statusLabels = useMemo(() => ({
    WORK: t('timestamps.workStart'),
    END: t('timestamps.workEnd'),
    REST: t('timestamps.restStart'),
  }), [t]);

  // Store callbacks in ref to stabilize loadSummary reference
  const callbacksRef = useRef({ onGetSummary, onStatusChange, onPendingSessionChange });
  callbacksRef.current = { onGetSummary, onStatusChange, onPendingSessionChange };

  const loadSummary = useCallback(async () => {
    try {
      const result = await callbacksRef.current.onGetSummary();
      if (result.success && result.summary) {
        setSummary(result.summary);
        callbacksRef.current.onStatusChange?.(result.summary.currentStatus);
        callbacksRef.current.onPendingSessionChange?.(result.summary.pendingSession);
      }
    } catch (error) {
      console.error('Load summary error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();

    // Refresh every minute
    const interval = setInterval(loadSummary, 60000);

    return () => clearInterval(interval);
  }, [loadSummary]);

  // Refresh summary when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadSummary();
    }
  }, [refreshTrigger, loadSummary]);

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('todaySummary.title')}</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        </Card.Body>
      </Card>
    );
  }

  const currentStatusConfig = summary ? statusConfig[summary.currentStatus] : statusConfig.NOT_STARTED;
  const pendingSession = summary?.pendingSession;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('todaySummary.title')}</h2>
          <Badge variant={currentStatusConfig.variant}>{currentStatusConfig.label}</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        {pendingSession && !isWarningDismissed && (
          <Alert variant="warning" className="mb-4">
            <div className="font-medium">{t('todaySummary.pendingWarning.title')}</div>
            <div className="text-sm mt-1">
              {t('todaySummary.pendingWarning.message', {
                date: formatPendingDate(pendingSession.timestamp),
                status: statusLabels[pendingSession.status as keyof typeof statusLabels] || pendingSession.status,
              })}
            </div>
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWarningDismissed(true)}
              >
                {t('todaySummary.pendingWarning.dismiss')}
              </Button>
            </div>
          </Alert>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('todaySummary.workTime')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {summary ? formatMinutes(summary.workMinutes) : '0h 0m'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('todaySummary.restTime')}</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {summary ? formatMinutes(summary.restMinutes) : '0h 0m'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{t('todaySummary.actualTime')}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {summary ? formatMinutes(summary.actualWorkMinutes) : '0h 0m'}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
