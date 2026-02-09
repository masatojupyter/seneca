'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

type PaymentRequest = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  amountUsd: number;
  cryptoType: string;
  cryptoAmount: number;
  status: string;
  transactionHash: string | null;
  processedAt: string | null;
  createdAt: string;
};

type PaymentRequestTableProps = {
  paymentRequests: PaymentRequest[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function PaymentRequestTable({ paymentRequests }: PaymentRequestTableProps) {
  const t = useTranslations();

  const statusLabels = useMemo(() => ({
    PENDING: t('payments.status.pending'),
    PROCESSING: t('payments.status.processing'),
    COMPLETED: t('payments.status.completed'),
    FAILED: t('payments.status.failed'),
  }), [t]);

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('payments.list.title')}</h2>

        {paymentRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('payments.list.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payments.list.worker')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payments.list.amountUsd')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payments.list.crypto')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('payments.list.requestDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.workerName}</div>
                      <div className="text-sm text-gray-500">{req.workerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${req.amountUsd.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {req.cryptoAmount.toFixed(6)} {req.cryptoType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[req.status as keyof typeof statusLabels] || req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/payments/${req.id}`}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        {t('common.details')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
