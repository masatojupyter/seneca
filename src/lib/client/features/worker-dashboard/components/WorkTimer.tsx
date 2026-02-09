'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { useWorkTimer } from '../hooks/use-work-timer';
import type { TimestampData } from '../action/timestamp-actions';

type WorkTimerProps = {
  timestamps: TimestampData[];
};

/**
 * Real-time work timer
 *
 * Displays current state and elapsed time based on recent timestamp status
 */
export const WorkTimer = memo(function WorkTimer({ timestamps }: WorkTimerProps): React.JSX.Element {
  const t = useTranslations();
  const { state, formattedTime } = useWorkTimer(timestamps);

  const stateDisplay = useMemo(() => {
    switch (state) {
      case 'WORKING':
        return {
          label: t('timestamps.work'),
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'RESTING':
        return {
          label: t('timestamps.rest'),
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'IDLE':
      default:
        return {
          label: t('workTimer.idle'),
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  }, [state, t]);

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{t('workTimer.currentStatus')}</p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${stateDisplay.bgColor} ${stateDisplay.color}`}>
              {stateDisplay.label}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('workTimer.elapsedTime')}</p>
            <p className="text-3xl font-bold text-gray-900 font-mono mt-1">
              {formattedTime}
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
});
