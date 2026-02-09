'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { executePaymentAction } from '../action/payment-actions';

type ExecutePaymentButtonProps = {
  paymentRequestId: string;
  status: string;
};

export function ExecutePaymentButton({
  paymentRequestId,
  status,
}: ExecutePaymentButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPending = status === 'PENDING';
  const isProcessing = status === 'PROCESSING';

  async function handleExecute() {
    setError(null);
    setIsExecuting(true);

    try {
      const result = await executePaymentAction(paymentRequestId);

      if (result.success) {
        setShowConfirmModal(false);
        router.refresh();
      } else {
        setError(result.error || t('payments.execute.failed'));
      }
    } catch (err) {
      setError(t('common.unexpectedError'));
    } finally {
      setIsExecuting(false);
    }
  }

  if (isProcessing) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
        {t('payments.execute.processing')}
      </div>
    );
  }

  if (!isPending) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-center">
        {t('payments.execute.alreadyProcessed')}
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

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={isExecuting}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {t('payments.execute.button')}
        </button>

        <div className="text-xs text-gray-500 text-center">
          {t('payments.execute.description')}
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('payments.execute.confirmTitle')}</h3>

            <p className="text-sm text-gray-600 mb-6">
              {t('payments.execute.confirmMessage')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setError(null);
                }}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? t('common.executing') : t('common.execute')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
