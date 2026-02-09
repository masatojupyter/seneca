'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';

type MonthNavigatorProps = {
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (year: number, month: number) => void;
};

function isSameMonth(year: number, month: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

function formatMonth(year: number, month: number): string {
  return `${year}/${String(month).padStart(2, '0')}`;
}

function toInputMonthString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function MonthNavigator({ selectedYear, selectedMonth, onMonthChange }: MonthNavigatorProps): React.JSX.Element {
  const t = useTranslations();
  const monthInputRef = useRef<HTMLInputElement>(null);
  const isCurrentMonth = isSameMonth(selectedYear, selectedMonth);

  const handlePrev = (): void => {
    if (selectedMonth === 1) {
      onMonthChange(selectedYear - 1, 12);
    } else {
      onMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNext = (): void => {
    if (isCurrentMonth) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let nextYear = selectedYear;
    let nextMonth = selectedMonth + 1;
    if (nextMonth > 12) {
      nextYear += 1;
      nextMonth = 1;
    }

    // 当月を超えないようにクランプ
    if (nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth)) {
      onMonthChange(currentYear, currentMonth);
    } else {
      onMonthChange(nextYear, nextMonth);
    }
  };

  const handlePickerClick = (): void => {
    monthInputRef.current?.showPicker();
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (!value) return;
    const [y, m] = value.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (y > currentYear || (y === currentYear && m > currentMonth)) {
      onMonthChange(currentYear, currentMonth);
    } else {
      onMonthChange(y, m);
    }
  };

  const handleThisMonth = (): void => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  const now = new Date();
  const maxMonth = toInputMonthString(now.getFullYear(), now.getMonth() + 1);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
          aria-label={t('monthNavigator.previousMonth')}
        >
          <svg className="h-5 w-5" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handlePickerClick}
          className="relative text-sm font-semibold text-gray-800 min-w-[120px] text-center px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {formatMonth(selectedYear, selectedMonth)}
          <input
            ref={monthInputRef}
            type="month"
            value={toInputMonthString(selectedYear, selectedMonth)}
            max={maxMonth}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isCurrentMonth}
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label={t('monthNavigator.nextMonth')}
        >
          <svg className="h-5 w-5" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={handleThisMonth}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {t('common.thisMonth')}
        </button>
      )}
    </div>
  );
}
