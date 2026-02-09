'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  approveApplicationAction,
  rejectApplicationAction,
} from '../action/approval-actions';

type RejectionCategory = 'TIME_ERROR' | 'MISSING_REST' | 'DUPLICATE' | 'POLICY_VIOLATION' | 'OTHER';

type ApprovalActionsProps = {
  applicationId: string;
  status: string;
};

export function ApprovalActions({ applicationId, status }: ApprovalActionsProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState<RejectionCategory | ''>('');
  const [error, setError] = useState<string | null>(null);

  const isPending = status === 'PENDING';

  const rejectionCategories = useMemo(() => [
    { value: 'TIME_ERROR' as const, label: t('applications.rejectCategories.timeError'), description: t('applications.rejectCategories.timeErrorDesc') },
    { value: 'MISSING_REST' as const, label: t('applications.rejectCategories.breakMissing'), description: t('applications.rejectCategories.breakMissingDesc') },
    { value: 'DUPLICATE' as const, label: t('applications.rejectCategories.duplicate'), description: t('applications.rejectCategories.duplicateDesc') },
    { value: 'POLICY_VIOLATION' as const, label: t('applications.rejectCategories.violation'), description: t('applications.rejectCategories.violationDesc') },
    { value: 'OTHER' as const, label: t('applications.rejectCategories.other'), description: t('applications.rejectCategories.otherDesc') },
  ], [t]);

  async function handleApprove() {
    setError(null);
    setIsApproving(true);

    try {
      const result = await approveApplicationAction(applicationId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || t('applications.approval.approveFailed'));
      }
    } catch (err) {
      setError(t('common.unexpectedError'));
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectionCategory) {
      setError(t('applications.approval.categoryRequired'));
      return;
    }

    if (rejectionReason.length < 10) {
      setError(t('applications.approval.reasonRequired'));
      return;
    }

    setError(null);
    setIsRejecting(true);

    try {
      const result = await rejectApplicationAction({
        applicationId,
        rejectionReason,
        rejectionCategory,
      });

      if (result.success) {
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectionCategory('');
        router.refresh();
      } else {
        setError(result.error || t('applications.approval.rejectFailed'));
      }
    } catch (err) {
      setError(t('common.unexpectedError'));
    } finally {
      setIsRejecting(false);
    }
  }

  if (!isPending) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-center">
        {t('applications.approval.alreadyProcessed')}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isApproving ? t('applications.approval.approving') : t('applications.approval.approve')}
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isRejecting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {t('applications.approval.reject')}
          </button>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('applications.approval.rejectTitle')}</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="rejectionCategory" className="block text-sm font-medium text-gray-700 mb-2">
                {t('applications.approval.rejectCategory')} <span className="text-red-500">*</span>
              </label>
              <select
                id="rejectionCategory"
                value={rejectionCategory}
                onChange={(e) => setRejectionCategory(e.target.value as RejectionCategory | '')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">{t('common.pleaseSelect')}</option>
                {rejectionCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                {t('applications.approval.rejectReason')} <span className="text-red-500">*</span>
                <span className="text-gray-400 text-xs ml-2">{t('applications.approval.rejectReasonMin')}</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder={t('applications.approval.rejectReasonHint')}
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('applications.approval.minChars', { count: rejectionReason.length })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setRejectionCategory('');
                  setError(null);
                }}
                disabled={isRejecting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectionCategory || rejectionReason.length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isRejecting ? t('applications.approval.rejecting') : t('applications.approval.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
