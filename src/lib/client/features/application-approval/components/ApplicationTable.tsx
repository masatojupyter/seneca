'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import {
  approveApplicationAction,
  bulkApproveApplicationsAction,
} from '../action/approval-actions';

type Application = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  createdAt: string;
};

type ApplicationTableProps = {
  applications: Application[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REQUESTED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-purple-100 text-purple-800',
};

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function ApplicationTable({ applications }: ApplicationTableProps) {
  const router = useRouter();
  const t = useTranslations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabels = useMemo(() => ({
    PENDING: t('applications.status.pending'),
    APPROVED: t('applications.status.approved'),
    REJECTED: t('applications.status.rejected'),
    REQUESTED: t('applications.status.paymentRequested'),
    PAID: t('applications.status.paid'),
  }), [t]);

  const filterTabs = useMemo(() => [
    { value: 'ALL' as const, label: t('applications.status.all'), activeClass: 'bg-blue-600 text-white' },
    { value: 'PENDING' as const, label: t('applications.status.pending'), activeClass: 'bg-orange-600 text-white' },
    { value: 'APPROVED' as const, label: t('applications.status.approved'), activeClass: 'bg-green-600 text-white' },
    { value: 'REJECTED' as const, label: t('applications.status.rejected'), activeClass: 'bg-red-600 text-white' },
  ], [t]);

  const filteredApplications = statusFilter === 'ALL'
    ? applications
    : applications.filter((app) => app.status === statusFilter);

  const pendingApplications = filteredApplications.filter(
    (app) => app.status === 'PENDING'
  );
  const allPendingSelected =
    pendingApplications.length > 0 &&
    pendingApplications.every((app) => selectedIds.has(app.id));

  function handleSelectAll(): void {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingApplications.map((app) => app.id)));
    }
  }

  function handleSelectOne(id: string): void {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  async function handleApprove(applicationId: string): Promise<void> {
    setError(null);
    setApprovingId(applicationId);

    try {
      const result = await approveApplicationAction(applicationId);

      if (result.success) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
        router.refresh();
      } else {
        setError(result.error || t('applications.approval.approveFailed'));
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setApprovingId(null);
    }
  }

  async function handleBulkApprove(): Promise<void> {
    if (selectedIds.size === 0) return;

    setError(null);
    setIsBulkApproving(true);

    try {
      const result = await bulkApproveApplicationsAction(
        Array.from(selectedIds)
      );

      if (result.success) {
        setSelectedIds(new Set(result.failedIds || []));
        router.refresh();
      }

      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError(t('applications.approval.bulkApproveFailed'));
    } finally {
      setIsBulkApproving(false);
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('applications.list.title')}</h2>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('applications.list.selectedCount', { count: selectedIds.size })}
              </span>
              <button
                onClick={handleBulkApprove}
                disabled={isBulkApproving}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isBulkApproving ? t('applications.list.bulkApproving') : t('applications.list.bulkApprove')}
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setSelectedIds(new Set());
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? tab.activeClass
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {filteredApplications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t('applications.list.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center w-12">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={handleSelectAll}
                      disabled={pendingApplications.length === 0}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('applications.list.worker')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.time')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('applications.list.duration')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.details')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => {
                  const isPending = app.status === 'PENDING';
                  const isApproving = approvingId === app.id;

                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-center">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => handleSelectOne(app.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="h-4 w-4 block" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.workerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.workerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const start = new Date(app.startDate).toLocaleDateString('ja-JP');
                          const end = new Date(app.endDate).toLocaleDateString('ja-JP');
                          if (start === end) {
                            return (
                              <div className="text-sm text-gray-900">{start}</div>
                            );
                          }
                          return (
                            <>
                              <div className="text-sm text-gray-900">{start}</div>
                              <div className="text-sm text-gray-500">〜 {end}</div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.firstTimestamp && app.lastTimestamp ? (
                          <div className="text-sm text-gray-900">
                            {new Date(app.firstTimestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            {' 〜 '}
                            {new Date(app.lastTimestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">−</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {Math.floor(app.totalMinutes / 60)}{t('common.hours')}{app.totalMinutes % 60}{t('common.minutes')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${app.totalAmountUsd.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            STATUS_COLORS[app.status] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusLabels[app.status as keyof typeof statusLabels] || app.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/admin/dashboard/applications/${app.id}`}
                          className="text-blue-600 hover:text-blue-900 hover:underline text-sm"
                        >
                          {t('common.details')}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={isApproving || isBulkApproving}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {isApproving ? t('applications.list.approving') : t('applications.approval.approve')}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">−</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
