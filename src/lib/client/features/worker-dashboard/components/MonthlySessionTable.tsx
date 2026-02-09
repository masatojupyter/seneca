'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Table, Badge, Loading } from '@/components/ui';
import { ROUTES } from '@/lib/client/routes';
import type { MonthlySessionData } from '@/lib/client/features/worker-dashboard/action/session-actions';

type MonthlySessionTableProps = {
  sessions: MonthlySessionData[];
  isLoading: boolean;
};

const DAY_OF_WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateString: string): string {
  const [y, m, d] = dateString.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const dow = DAY_OF_WEEK_LABELS[date.getDay()];
  return `${m}/${d} (${dow})`;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function MonthlySessionTable({ sessions, isLoading }: MonthlySessionTableProps): React.JSX.Element {
  const t = useTranslations();

  const statusConfig = useMemo(() => ({
    NONE: { label: t('sessions.status.notApplied'), variant: 'default' as const },
    PENDING: { label: t('sessions.status.pending'), variant: 'warning' as const },
    APPROVED: { label: t('sessions.status.approved'), variant: 'success' as const },
    REJECTED: { label: t('sessions.status.rejected'), variant: 'danger' as const },
    REQUESTED: { label: t('sessions.status.paymentRequested'), variant: 'info' as const },
    PAID: { label: t('sessions.status.paid'), variant: 'success' as const },
    INCOMPLETE: { label: t('sessions.status.incomplete'), variant: 'default' as const },
  }), [t]);

  const rejectionCategoryLabels = useMemo(() => ({
    TIME_ERROR: t('sessions.rejectReasons.timeError'),
    MISSING_REST: t('sessions.rejectReasons.breakMissing'),
    DUPLICATE: t('sessions.rejectReasons.duplicate'),
    POLICY_VIOLATION: t('sessions.rejectReasons.violation'),
    OTHER: t('applications.rejectCategories.other'),
  }), [t]);
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="md" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('sessions.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>{t('sessions.table.date')}</Table.Head>
            <Table.Head>{t('sessions.table.start')}</Table.Head>
            <Table.Head>{t('sessions.table.end')}</Table.Head>
            <Table.Head>{t('sessions.table.workTime')}</Table.Head>
            <Table.Head>{t('sessions.table.restTime')}</Table.Head>
            <Table.Head>{t('sessions.table.status')}</Table.Head>
            <Table.Head className="w-20">{t('common.actions')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sessions.map((session, index) => {
            const config = statusConfig[session.status as keyof typeof statusConfig] || statusConfig.NONE;
            const isRejected = session.status === 'REJECTED';

            return (
              <Table.Row
                key={`${session.date}-${index}`}
                className={isRejected ? 'bg-red-50' : ''}
              >
                <Table.Cell className="font-medium">
                  {formatDate(session.date)}
                </Table.Cell>
                <Table.Cell>
                  {formatTime(session.startTime)}
                </Table.Cell>
                <Table.Cell>
                  {session.endTime ? formatTime(session.endTime) : '-'}
                </Table.Cell>
                <Table.Cell>
                  {session.workMinutes > 0 ? formatDuration(session.workMinutes) : '-'}
                </Table.Cell>
                <Table.Cell>
                  {session.restMinutes > 0 ? formatDuration(session.restMinutes) : '-'}
                </Table.Cell>
                <Table.Cell>
                  <div className="space-y-1">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {isRejected && session.rejectionCategory && (
                      <div className="text-xs text-red-600">
                        {rejectionCategoryLabels[session.rejectionCategory as keyof typeof rejectionCategoryLabels] || session.rejectionCategory}
                        {session.rejectionReason && (
                          <span className="block text-red-500 mt-0.5 truncate max-w-[200px]" title={session.rejectionReason}>
                            {session.rejectionReason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Link
                    href={`${ROUTES.WORKER.DASHBOARD}?date=${session.date}`}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {t('common.details')}
                  </Link>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
