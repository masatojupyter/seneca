'use client';

import { useState, memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Alert } from '@/components/ui';
import type { CreateTimestampInput, CurrentWorkStatus } from '../action/timestamp-actions';

type TimestampButtonsProps = {
  onCreateTimestamp: (data: CreateTimestampInput) => Promise<{ success: boolean; error?: string }>;
  onTimestampCreated: () => void;
  currentStatus: CurrentWorkStatus;
};

/**
 * Determine button enabled/disabled states
 * - Work: always enabled
 * - Rest: only enabled when working
 * - End: only enabled when working or resting
 */
function getButtonStates(currentStatus: CurrentWorkStatus): {
  workEnabled: boolean;
  restEnabled: boolean;
  endEnabled: boolean;
} {
  switch (currentStatus) {
    case 'NOT_STARTED':
      return { workEnabled: true, restEnabled: false, endEnabled: false };
    case 'WORKING':
      return { workEnabled: true, restEnabled: true, endEnabled: true };
    case 'RESTING':
      return { workEnabled: true, restEnabled: false, endEnabled: true };
    case 'ENDED':
      return { workEnabled: true, restEnabled: false, endEnabled: false };
    default:
      return { workEnabled: true, restEnabled: false, endEnabled: false };
  }
}

export const TimestampButtons = memo(function TimestampButtons({ onCreateTimestamp, onTimestampCreated, currentStatus }: TimestampButtonsProps): React.JSX.Element {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buttonStates = getButtonStates(currentStatus);

  const messages = useMemo(() => ({
    WORK: t('timestamps.clockedWork'),
    END: t('timestamps.clockedEnd'),
    REST: t('timestamps.clockedRest'),
  }), [t]);

  const handleTimestamp = async (status: 'WORK' | 'END' | 'REST') => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await onCreateTimestamp({ status });

      if (result.success) {
        setSuccess(messages[status]);
        onTimestampCreated();

        // Clear message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || t('timestamps.clockFailed'));
      }
    } catch (err) {
      console.error('Timestamp error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-3 gap-4">
        <Button
          variant="primary"
          onClick={() => handleTimestamp('WORK')}
          disabled={isLoading || !buttonStates.workEnabled}
          isLoading={isLoading}
        >
          Work
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleTimestamp('END')}
          disabled={isLoading || !buttonStates.endEnabled}
          isLoading={isLoading}
        >
          End
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleTimestamp('REST')}
          disabled={isLoading || !buttonStates.restEnabled}
          isLoading={isLoading}
        >
          Rest
        </Button>
      </div>
    </div>
  );
});
