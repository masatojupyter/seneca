'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Badge, Card, Alert } from '@/components/ui';
import { useGemWallet } from '@/lib/client/hooks/use-gem-wallet';
import { WalletConnectionModal } from './WalletConnectionModal';
import {
  createGemWalletOrganizationWalletAction,
  getOrganizationWalletsAction,
  getWalletBalanceAction,
} from '../action/organization-wallet-actions';

export function WalletConnectionSection(): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations('walletConnection');
  const tCrypto = useTranslations('cryptoSettings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [existingWallets, setExistingWallets] = useState<{ address: string; cryptoType: string }[]>([]);
  const [balance, setBalance] = useState<{ xrp: number; rlusd: number; rlusdConfigured: boolean } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  const {
    isConnected,
    isConnecting,
    isInstalled,
    address,
    network,
    error,
    connect,
    disconnect,
  } = useGemWallet();

  const loadExistingWallets = useCallback(async () => {
    const result = await getOrganizationWalletsAction();
    if (result.success && result.wallets) {
      setExistingWallets(result.wallets.map(w => ({ address: w.walletAddress, cryptoType: w.cryptoType })));
    }
  }, []);

  const loadBalance = useCallback(async (walletAddress: string) => {
    setBalanceLoading(true);
    const result = await getWalletBalanceAction(walletAddress);
    if (result.success) {
      setBalance({
        xrp: result.xrp ?? 0,
        rlusd: result.rlusd ?? 0,
        rlusdConfigured: result.rlusdConfigured ?? false,
      });
    }
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadExistingWallets();
  }, [loadExistingWallets]);

  useEffect(() => {
    if (isConnected && address) {
      // 既に登録済みのアドレスなら残高を取得
      const isRegistered = existingWallets.some(w => w.address === address);
      if (isRegistered) {
        loadBalance(address);
      }
    }
  }, [isConnected, address, existingWallets, loadBalance]);

  const handleConnectGemWallet = async (): Promise<void> => {
    const success = await connect();
    if (success) {
      setIsModalOpen(false);
      await loadExistingWallets();
    }
  };

  const shortenAddress = (addr: string): string => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  const isAddressAlreadyRegistered = (cryptoType: string): boolean => {
    if (!address) return false;
    return existingWallets.some(w => w.address === address && w.cryptoType === cryptoType);
  };

  const handleImportAsOrganizationWallet = async (cryptoType: 'XRP' | 'RLUSD'): Promise<void> => {
    if (!address) return;

    setImportStatus({ loading: true, error: null, success: null });

    try {
      const result = await createGemWalletOrganizationWalletAction({
        cryptoType,
        walletAddress: address,
        label: `GemWallet (${cryptoType})`,
        isDefault: existingWallets.length === 0,
      });

      if (result.success) {
        setImportStatus({
          loading: false,
          error: null,
          success: tCrypto('gemwalletImport.importSuccess', { cryptoType }),
        });
        await loadExistingWallets();
        if (address) {
          await loadBalance(address);
        }
        router.refresh();
        setTimeout(() => {
          setImportStatus(prev => ({ ...prev, success: null }));
        }, 3000);
      } else {
        setImportStatus({
          loading: false,
          error: result.error ?? tCrypto('gemwalletImport.importFailed'),
          success: null,
        });
      }
    } catch {
      setImportStatus({
        loading: false,
        error: tCrypto('gemwalletImport.importFailed'),
        success: null,
      });
    }
  };

  if (!mounted) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">{t('sectionTitle')}</h3>
          <p className="text-sm text-gray-500">{t('sectionSubtitle')}</p>
        </Card.Header>
        <Card.Body>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">{t('sectionTitle')}</h3>
          <p className="text-sm text-gray-500">{t('sectionSubtitle')}</p>
        </Card.Header>
        <Card.Body>
          {importStatus.error && (
            <Alert variant="error" className="mb-4" onClose={() => setImportStatus(prev => ({ ...prev, error: null }))}>
              {importStatus.error}
            </Alert>
          )}
          {importStatus.success && (
            <Alert variant="success" className="mb-4" onClose={() => setImportStatus(prev => ({ ...prev, success: null }))}>
              {importStatus.success}
            </Alert>
          )}

          {isConnected && address ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-800">GemWallet</span>
                    <Badge variant="success">{t('connected')}</Badge>
                    {network && (
                      <Badge variant="info">{network}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-green-600 font-mono mt-1">
                    {shortenAddress(address)}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => disconnect()}
                >
                  {t('disconnect')}
                </Button>
              </div>

              {/* 残高表示 */}
              {balanceLoading ? (
                <div className="text-sm text-gray-500">{t('fetchingBalance')}</div>
              ) : balance ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">XRP</div>
                    <div className="text-lg font-semibold text-gray-900">{balance.xrp.toFixed(2)}</div>
                  </div>
                  {balance.rlusdConfigured && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">RLUSD</div>
                      <div className="text-lg font-semibold text-gray-900">{balance.rlusd.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* 組織ウォレットとしてインポート */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {tCrypto('gemwalletImport.title')}
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  {tCrypto('gemwalletImport.description')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={isAddressAlreadyRegistered('XRP') ? 'secondary' : 'primary'}
                    onClick={() => handleImportAsOrganizationWallet('XRP')}
                    disabled={importStatus.loading || isAddressAlreadyRegistered('XRP')}
                  >
                    {isAddressAlreadyRegistered('XRP')
                      ? tCrypto('gemwalletImport.alreadyRegistered', { cryptoType: 'XRP' })
                      : tCrypto('gemwalletImport.importAsXrp')}
                  </Button>
                  <Button
                    size="sm"
                    variant={isAddressAlreadyRegistered('RLUSD') ? 'secondary' : 'primary'}
                    onClick={() => handleImportAsOrganizationWallet('RLUSD')}
                    disabled={importStatus.loading || isAddressAlreadyRegistered('RLUSD')}
                  >
                    {isAddressAlreadyRegistered('RLUSD')
                      ? tCrypto('gemwalletImport.alreadyRegistered', { cryptoType: 'RLUSD' })
                      : tCrypto('gemwalletImport.importAsRlusd')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {!isInstalled && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  {t('gemwalletNotInstalled')}
                  <a
                    href="https://gemwallet.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline hover:text-yellow-800"
                  >
                    {t('installGemwallet')}
                  </a>
                </div>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                disabled={isConnecting}
              >
                {isConnecting ? t('connecting') : t('connectButton')}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnectGemWallet={handleConnectGemWallet}
        isConnecting={isConnecting}
      />
    </>
  );
}
