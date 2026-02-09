'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { updateWorkerAction, type WorkerDetail } from '../action/worker-actions';

type EditWorkerFormProps = {
  worker: WorkerDetail;
};

export function EditWorkerForm({ worker }: EditWorkerFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [hourlyRateUsd, setHourlyRateUsd] = useState(worker.hourlyRateUsd.toString());
  const [isActive, setIsActive] = useState(worker.isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await updateWorkerAction({
        workerId: worker.id,
        hourlyRateUsd: parseFloat(hourlyRateUsd),
        isActive,
      });

      if (result.success) {
        setSuccess(t('workers.edit.updateSuccess'));
        router.refresh();
      } else {
        setError(result.error || t('workers.edit.updateFailed'));
      }
    } catch (err) {
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="hourlyRateUsd" className="block text-sm font-medium text-gray-700">
          {t('workers.detail.hourlyRate')}
        </label>
        <input
          type="number"
          id="hourlyRateUsd"
          step="0.01"
          min="0"
          value={hourlyRateUsd}
          onChange={(e) => setHourlyRateUsd(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          {t('common.active')}
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? t('common.loading') : t('common.update')}
      </button>
    </form>
  );
}
