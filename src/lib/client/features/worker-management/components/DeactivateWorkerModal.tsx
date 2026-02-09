'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { updateWorkerAction } from '@/lib/client/features/worker-management/action/worker-actions';

type DeactivateWorkerModalProps = {
  isOpen: boolean;
  worker: { id: string; name: string; email: string } | null;
  onClose: () => void;
  onDeactivated: () => void;
};

export function DeactivateWorkerModal({ isOpen, worker, onClose, onDeactivated }: DeactivateWorkerModalProps) {
  const t = useTranslations();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate(): Promise<void> {
    if (!worker) return;

    setError(null);
    setIsDeactivating(true);

    try {
      const result = await updateWorkerAction({
        workerId: worker.id,
        isActive: false,
      });

      if (result.success) {
        onDeactivated();
      } else {
        setError(result.error || t('workers.deactivate.failed'));
      }
    } catch {
      setError(t('common.unexpectedError'));
    } finally {
      setIsDeactivating(false);
    }
  }

  function handleClose(): void {
    if (isDeactivating) return;
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header>
        <h3 className="text-lg font-semibold text-gray-900">{t('workers.deactivate.title')}</h3>
      </Modal.Header>
      <Modal.Body>
        {worker && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              {t('workers.deactivate.confirmMessage')}
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm font-medium text-gray-900">{worker.name}</p>
              <p className="text-sm text-gray-500">{worker.email}</p>
            </div>
            <p className="text-sm text-red-600">
              {t('workers.deactivate.warningMessage')}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClose}
          disabled={isDeactivating}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDeactivate}
          isLoading={isDeactivating}
        >
          {t('workers.deactivate.button')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
