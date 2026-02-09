'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { DeactivateWorkerModal } from '@/lib/client/features/worker-management/components/DeactivateWorkerModal';

type Worker = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type WorkerListProps = {
  workers: Worker[];
};

export function WorkerList({ workers }: WorkerListProps) {
  const router = useRouter();
  const t = useTranslations();
  const [deactivateTarget, setDeactivateTarget] = useState<Worker | null>(null);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('workers.list.title')}</h2>

        {workers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('workers.list.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workers.list.hourlyRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('workers.list.registeredDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr
                    key={worker.id}
                    className={`hover:bg-gray-50 ${!worker.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{worker.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${worker.hourlyRateUsd.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          worker.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {worker.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(worker.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/admin/dashboard/workers/${worker.id}`}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {t('common.details')}
                      </Link>
                      {worker.isActive && (
                        <button
                          onClick={() => setDeactivateTarget(worker)}
                          className="text-red-600 hover:text-red-900 hover:underline"
                        >
                          {t('workers.list.deactivate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeactivateWorkerModal
        isOpen={deactivateTarget !== null}
        worker={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onDeactivated={() => {
          setDeactivateTarget(null);
          router.refresh();
        }}
      />
    </Card>
  );
}
