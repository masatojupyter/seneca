'use client';

import { memo, useRef } from 'react';
import { useTranslations } from 'next-intl';

type DateNavigatorProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

const DAY_OF_WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dow = DAY_OF_WEEK_LABELS[date.getDay()];
  return `${y}/${m}/${d} (${dow})`;
}

function toInputDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DateNavigator = memo(function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps): React.JSX.Element {
  const t = useTranslations();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const handlePrev = (): void => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const handleNext = (): void => {
    if (isToday) return;
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextStart = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    if (nextStart > todayStart) {
      onDateChange(today);
    } else {
      onDateChange(next);
    }
  };

  const handleCalendarClick = (): void => {
    dateInputRef.current?.showPicker();
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (!value) return;
    const [y, m, d] = value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selected > todayStart) {
      onDateChange(today);
    } else {
      onDateChange(selected);
    }
  };

  const handleToday = (): void => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
        {/* Previous day arrow */}
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
          aria-label={t('dateNavigator.previousDay')}
        >
          <svg className="h-5 w-5" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* 日付表示（クリックでカレンダー表示） */}
        <button
          type="button"
          onClick={handleCalendarClick}
          className="relative text-sm font-semibold text-gray-800 min-w-[150px] text-center px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {formatDate(selectedDate)}
          <input
            ref={dateInputRef}
            type="date"
            value={toInputDateString(selectedDate)}
            max={toInputDateString(today)}
            onChange={handleCalendarChange}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        {/* Next day arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isToday}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label={t('dateNavigator.nextDay')}
        >
          <svg className="h-5 w-5" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Today button */}
      {!isToday && (
        <button
          type="button"
          onClick={handleToday}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {t('common.today')}
        </button>
      )}
    </div>
  );
});
