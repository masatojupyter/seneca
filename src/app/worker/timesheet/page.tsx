'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading } from '@/components/ui';
import {
  TimestampTable,
  PeriodSelector,
  getTimestampsByPeriodAction,
  updateTimestampAction,
  deleteTimestampAction,
  type TimestampItem,
} from '@/lib/client/features/timesheet';

export default function TimesheetPage(): React.JSX.Element {
  const t = useTranslations();
  const [timestamps, setTimestamps] = useState<TimestampItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<{ startDate: string; endDate: string }>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    return {
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString(),
    };
  });

  const loadTimestamps = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await getTimestampsByPeriodAction(period);
      if (result.success && result.timestamps) {
        setTimestamps(result.timestamps);
      }
    } catch (error) {
      console.error('Load timestamps error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimestamps();
  }, [period]);

  const handlePeriodChange = (startDate: string, endDate: string): void => {
    setPeriod({ startDate, endDate });
  };

  const handleUpdate = async (
    id: string,
    data: { status?: string; timestamp?: string; memo?: string }
  ) => {
    return await updateTimestampAction({
      id,
      ...data,
      status: data.status as 'WORK' | 'REST' | 'END' | undefined,
    });
  };

  const handleDelete = async (id: string) => {
    return await deleteTimestampAction({ id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('timesheet.title')}</h1>
        <p className="text-gray-600 mt-1">{t('timesheet.subtitle')}</p>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('timesheet.periodSelect')}</h2>
        </Card.Header>
        <Card.Body>
          <PeriodSelector onPeriodChange={handlePeriodChange} />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('timesheet.timestampList')}</h2>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : (
            <TimestampTable
              timestamps={timestamps}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onRefresh={loadTimestamps}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
