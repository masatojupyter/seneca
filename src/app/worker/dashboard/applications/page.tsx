'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { MonthNavigator } from '@/lib/client/features/worker-dashboard/components/MonthNavigator';
import { MonthlySessionTable } from '@/lib/client/features/worker-dashboard/components/MonthlySessionTable';
import { getMonthlySessionsAction } from '@/lib/client/features/worker-dashboard/action/session-actions';
import type { MonthlySessionData } from '@/lib/client/features/worker-dashboard/action/session-actions';

export default function DashboardApplicationsPage(): React.JSX.Element {
  const t = useTranslations();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [sessions, setSessions] = useState<MonthlySessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMonthlySessionsAction({
        year: selectedYear,
        month: selectedMonth,
      });
      if (result.success && result.sessions) {
        setSessions(result.sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Load sessions error:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleMonthChange = (year: number, month: number): void => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const summary = {
    total: sessions.length,
    none: sessions.filter(s => s.status === 'NONE').length,
    pending: sessions.filter(s => s.status === 'PENDING').length,
    approved: sessions.filter(s => s.status === 'APPROVED').length,
    rejected: sessions.filter(s => s.status === 'REJECTED').length,
    totalWorkMinutes: sessions.reduce((sum, s) => sum + s.workMinutes, 0),
  };

  const totalWorkHours = Math.floor(summary.totalWorkMinutes / 60);
  const totalWorkMins = summary.totalWorkMinutes % 60;

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('applicationList.title')}</h1>
        <p className="text-gray-600 mt-1">{t('applicationList.subtitle')}</p>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('sessions.title')}</h2>
            <MonthNavigator
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
            />
          </div>
        </Card.Header>
        <Card.Body>
          {!isLoading && sessions.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
              <span>{t('sessions.totalCount', { count: summary.total })}</span>
              <span>{t('sessions.totalWork', { hours: totalWorkHours, minutes: totalWorkMins })}</span>
              {summary.none > 0 && <span>{t('sessions.notApplied', { count: summary.none })}</span>}
              {summary.pending > 0 && <span className="text-orange-600">{t('sessions.applying', { count: summary.pending })}</span>}
              {summary.approved > 0 && <span className="text-green-600">{t('sessions.approved', { count: summary.approved })}</span>}
              {summary.rejected > 0 && <span className="text-red-600">{t('sessions.rejected', { count: summary.rejected })}</span>}
            </div>
          )}

          <MonthlySessionTable
            sessions={sessions}
            isLoading={isLoading}
          />
        </Card.Body>
      </Card>
    </div>
  );
}
