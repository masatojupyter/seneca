'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui';

type PeriodSelectorProps = {
  onPeriodChange: (startDate: string, endDate: string) => void;
};

export function PeriodSelector({ onPeriodChange }: PeriodSelectorProps): React.JSX.Element {
  const t = useTranslations();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 日付の終わりまで含める
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    onPeriodChange(start.toISOString(), end.toISOString());
  };

  const handleThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);

    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    onPeriodChange(firstDay.toISOString(), lastDay.toISOString());
  };

  const handleLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);

    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    onPeriodChange(firstDay.toISOString(), lastDay.toISOString());
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            label={t('timesheet.startDate')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input
            label={t('timesheet.endDate')}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="primary">
          {t('common.search')}
        </Button>
      </form>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleThisMonth}>
          {t('common.thisMonth')}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleLastMonth}>
          {t('common.lastMonth')}
        </Button>
      </div>
    </div>
  );
}
