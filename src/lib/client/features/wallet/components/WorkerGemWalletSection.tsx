'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Badge, Button, Alert } from '@/components/ui';
import { useGemWallet } from '@/lib/client/hooks/use-gem-wallet';
import { getExternalWalletBalanceAction } from '@/lib/client/features/crypto-settings';
import { createAddressAction } from '../action/wallet-actions';
import type { CryptoType } from '@/lib/shared/entity';

type BalanceState = {
  xrp: number;
  rlusd: number;
  rlusdConfigured: boolean;
  loading: boolean;
  error: string | null;
};

type WorkerGemWalletSectionProps = {
  onAddressImported?: () => void;
  existingAddresses?: { cryptoType: string; address: string }[];
};

export function WorkerGemWalletSection({
  onAddressImported,
  existingAddresses = [],
}: WorkerGemWalletSectionProps): React.JSX.Element {
  const t = useTranslations('walletConnection');
  const tWallet = useTranslations('wallet');
  const tCommon = useTranslations('common');
  const {
    isConnected,
    isConnecting,
    isInstalled,
    address,
    network,
    error: walletError,
    connect,
    disconnect,
  } = useGemWallet();

  const [balance, setBalance] = useState<BalanceState>({
    xrp: 0,
    rlusd: 0,
    rlusdConfigured: false,
    loading: false,
    error: null,
  });
  const [mounted, setMounted] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null,
  });

  const fetchBalance = useCallback(async (): Promise<void> => {
    if (!address) return;

    setBalance((prev) => ({ ...prev, loading: true, error: null }));

    const result = await getExternalWalletBalanceAction(address);

    if (result.success) {
      setBalance({
        xrp: result.xrp ?? 0,
        rlusd: result.rlusd ?? 0,
        rlusdConfigured: result.rlusdConfigured ?? false,
        loading: false,
        error: null,
      });
    } else {
      setBalance((prev) => ({
        ...prev,
        loading: false,
        error: result.error ?? null,
      }));
    }
  }, [address]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
    }
  }, [isConnected, address, fetchBalance]);

  const shortenAddress = (addr: string): string => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const isAddressAlreadyRegistered = (cryptoType: string): boolean => {
    if (!address) return false;
    return existingAddresses.some(
      (a) => a.address === address && a.cryptoType === cryptoType
    );
  };

  const handleImportAddress = async (cryptoType: CryptoType): Promise<void> => {
    if (!address) return;

    setImportStatus({ loading: true, error: null, success: null });

    try {
      const result = await createAddressAction({
        cryptoType,
        address,
        label: `GemWallet (${cryptoType})`,
        isDefault: existingAddresses.length === 0,
      });

      if (result.success) {
        setImportStatus({
          loading: false,
          error: null,
          success: tWallet('gemwallet.importSuccess', { cryptoType }),
        });
        onAddressImported?.();
        setTimeout(() => {
          setImportStatus((prev) => ({ ...prev, success: null }));
        }, 3000);
      } else {
        setImportStatus({
          loading: false,
          error: result.error || tWallet('gemwallet.importFailed'),
          success: null,
        });
      }
    } catch {
      setImportStatus({
        loading: false,
        error: tWallet('gemwallet.importFailed'),
        success: null,
      });
    }
  };

  const handleConnect = async (): Promise<void> => {
    await connect();
  };

  if (!mounted) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <Card.Header>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
            <svg
              viewBox="0 0 40 40"
              className="w-6 h-6"
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('sectionTitle')}</h3>
            <p className="text-sm text-gray-500">{tWallet('gemwallet.subtitle')}</p>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {walletError && (
          <Alert variant="error" className="mb-4">
            {walletError}
          </Alert>
        )}

        {importStatus.error && (
          <Alert variant="error" className="mb-4" onClose={() => setImportStatus((prev) => ({ ...prev, error: null }))}>
            {importStatus.error}
          </Alert>
        )}

        {importStatus.success && (
          <Alert variant="success" className="mb-4" onClose={() => setImportStatus((prev) => ({ ...prev, success: null }))}>
            {importStatus.success}
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-4">
            {!isInstalled && (
              <Alert variant="warning">
                {t('gemwalletNotInstalled')}
                <a
                  href="https://gemwallet.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-yellow-800"
                >
                  {t('installGemwallet')}
                </a>
              </Alert>
            )}
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? t('connecting') : t('connectButton')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">GemWallet</span>
                    <Badge variant="success">{t('connected')}</Badge>
                    {network && <Badge variant="info">{network}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    {address && shortenAddress(address)}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={disconnect}>
                {t('disconnect')}
              </Button>
            </div>

            {/* Balance Display */}
            {balance.loading ? (
              <div className="text-sm text-gray-500">{t('fetchingBalance')}</div>
            ) : balance.error ? (
              <div className="text-sm text-red-500">{t('balanceFetchFailed')}</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">{tCommon('xrp')}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {balance.xrp.toFixed(2)}
                  </div>
                </div>
                {balance.rlusdConfigured && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">{tCommon('rlusd')}</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {balance.rlusd.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Buttons */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {tWallet('gemwallet.importTitle')}
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isAddressAlreadyRegistered('XRP') ? 'secondary' : 'primary'}
                  onClick={() => handleImportAddress('XRP')}
                  disabled={importStatus.loading || isAddressAlreadyRegistered('XRP')}
                  isLoading={importStatus.loading}
                >
                  {isAddressAlreadyRegistered('XRP')
                    ? tWallet('gemwallet.alreadyRegistered', { cryptoType: 'XRP' })
                    : tWallet('gemwallet.importAsXrp')}
                </Button>
                {balance.rlusdConfigured && (
                  <Button
                    size="sm"
                    variant={isAddressAlreadyRegistered('RLUSD') ? 'secondary' : 'primary'}
                    onClick={() => handleImportAddress('RLUSD')}
                    disabled={importStatus.loading || isAddressAlreadyRegistered('RLUSD')}
                    isLoading={importStatus.loading}
                  >
                    {isAddressAlreadyRegistered('RLUSD')
                      ? tWallet('gemwallet.alreadyRegistered', { cryptoType: 'RLUSD' })
                      : tWallet('gemwallet.importAsRlusd')}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {tWallet('gemwallet.importNote')}
              </p>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchBalance}
                disabled={balance.loading}
              >
                {t('refreshBalance')}
              </Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
