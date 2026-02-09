'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  cancelInvitationAction,
  resendInvitationAction,
} from '@/lib/client/features/invitation/action/invitation-actions';
import type { InvitationListItemDTO } from '@/lib/client/features/invitation/action/invitation-actions';

type InvitationListProps = {
  invitations: InvitationListItemDTO[];
};

export function InvitationList({ invitations }: InvitationListProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusConfig = useMemo(
    () => ({
      PENDING: { label: t('invitation.list.pending'), variant: 'warning' as const },
      ACCEPTED: { label: t('invitation.list.accepted'), variant: 'success' as const },
      EXPIRED: { label: t('invitation.list.expired'), variant: 'danger' as const },
    }),
    [t]
  );

  async function handleResend(invitationId: string): Promise<void> {
    setError(null);
    setResendingId(invitationId);

    try {
      const result = await resendInvitationAction({ invitationId });

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || t('invitation.list.resendFailed'));
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setResendingId(null);
    }
  }

  async function handleCancel(): Promise<void> {
    if (!cancelTargetId) return;

    setError(null);
    setCancellingId(cancelTargetId);

    try {
      const result = await cancelInvitationAction({ invitationId: cancelTargetId });

      if (result.success) {
        setCancelTargetId(null);
        router.refresh();
      } else {
        setError(result.error || t('invitation.list.cancelFailed'));
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setCancellingId(null);
    }
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('invitation.list.title')}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {invitations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('invitation.list.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitation.hourlyRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitation.list.invitedDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invitation.list.expiresAt')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => {
                  const config = statusConfig[invitation.status];
                  const isResending = resendingId === invitation.id;

                  return (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invitation.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${invitation.hourlyRateUsd.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invitation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invitation.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {invitation.status === 'EXPIRED' && (
                          <button
                            onClick={() => handleResend(invitation.id)}
                            disabled={isResending}
                            className="text-blue-600 hover:text-blue-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isResending ? t('invitation.list.resending') : t('invitation.list.resend')}
                          </button>
                        )}
                        {invitation.status === 'PENDING' && (
                          <button
                            onClick={() => setCancelTargetId(invitation.id)}
                            className="text-red-600 hover:text-red-900 hover:underline"
                          >
                            {t('invitation.list.cancelInvitation')}
                          </button>
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

      <Modal
        isOpen={cancelTargetId !== null}
        onClose={() => setCancelTargetId(null)}
      >
        <Modal.Header>
          <h3 className="text-lg font-semibold text-gray-900">{t('invitation.list.cancelInvitation')}</h3>
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-600">
            {t('invitation.list.cancelConfirm')}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCancelTargetId(null)}
            disabled={cancellingId !== null}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleCancel}
            isLoading={cancellingId !== null}
          >
            {t('invitation.list.cancelInvitation')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
