'use client';

import { useTranslations } from 'next-intl';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Button } from '@/components/ui';

type WalletConnectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConnectGemWallet: () => void;
  isConnecting: boolean;
};

export function WalletConnectionModal({
  isOpen,
  onClose,
  onConnectGemWallet,
  isConnecting,
}: WalletConnectionModalProps): React.JSX.Element {
  console.log('[WalletConnectionModal] Rendered with props:', { isOpen, isConnecting });

  const t = useTranslations('walletConnection');

  const handleGemWalletClick = (): void => {
    console.log('[WalletConnectionModal] GemWallet button clicked');
    console.log('[WalletConnectionModal] Calling onConnectGemWallet...');
    onConnectGemWallet();
  };

  const handleClose = (): void => {
    console.log('[WalletConnectionModal] Close button clicked');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Metamask - Disabled */}
          <button
            disabled
            className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed opacity-50"
            onClick={() => console.log('[WalletConnectionModal] Metamask clicked (disabled)')}
          >
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
              <svg
                viewBox="0 0 40 40"
                className="w-8 h-8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36.5 3.5L22.5 13.5L24.9 7.7L36.5 3.5Z"
                  fill="#E2761B"
                  stroke="#E2761B"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.5 3.5L17.4 13.6L15.1 7.7L3.5 3.5Z"
                  fill="#E4761B"
                  stroke="#E4761B"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M31.4 26.5L27.5 32.3L35.7 34.5L38 26.6L31.4 26.5Z"
                  fill="#E4761B"
                  stroke="#E4761B"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 26.6L4.3 34.5L12.5 32.3L8.6 26.5L2 26.6Z"
                  fill="#E4761B"
                  stroke="#E4761B"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-400">Metamask</div>
              <div className="text-sm text-gray-400">{t('metamaskNotSupported')}</div>
            </div>
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
              {t('comingSoon')}
            </span>
          </button>

          {/* GemWallet */}
          <Button
            onClick={handleGemWalletClick}
            disabled={isConnecting}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            variant="secondary"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
              <svg
                viewBox="0 0 40 40"
                className="w-8 h-8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="40" height="40" rx="8" fill="#0066FF" />
                <path
                  d="M20 8L12 14V26L20 32L28 26V14L20 8Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="20" r="4" fill="#0066FF" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">GemWallet</div>
              <div className="text-sm text-gray-500">{t('gemwalletDescription')}</div>
            </div>
            {isConnecting && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                {t('connecting')}
              </span>
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('cancel')}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
