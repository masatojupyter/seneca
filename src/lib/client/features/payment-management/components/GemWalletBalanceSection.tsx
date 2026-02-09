'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Badge, Button } from '@/components/ui';
import { useGemWallet } from '@/lib/client/hooks/use-gem-wallet';
import { getExternalWalletBalanceAction } from '@/lib/client/features/crypto-settings/action/external-wallet-balance-actions';

type BalanceState = {
  xrp: number;
  rlusd: number;
  rlusdConfigured: boolean;
  loading: boolean;
  error: string | null;
};

export function GemWalletBalanceSection(): React.JSX.Element {
  console.log('[GemWalletBalanceSection] Component rendered');

  const t = useTranslations('walletConnection');
  const tCommon = useTranslations('common');
  const { isConnected, address, network } = useGemWallet();

  console.log('[GemWalletBalanceSection] Wallet state:', { isConnected, address, network });

  const [balance, setBalance] = useState<BalanceState>({
    xrp: 0,
    rlusd: 0,
    rlusdConfigured: false,
    loading: false,
    error: null,
  });
  const [mounted, setMounted] = useState(false);

  console.log('[GemWalletBalanceSection] Balance state:', balance);
  console.log('[GemWalletBalanceSection] Mounted:', mounted);

  const fetchBalance = useCallback(async (): Promise<void> => {
    console.log('[GemWalletBalanceSection] fetchBalance: Starting...');
    console.log('[GemWalletBalanceSection] fetchBalance: address =', address);
    if (!address) {
      console.log('[GemWalletBalanceSection] fetchBalance: No address, returning');
      return;
    }

    console.log('[GemWalletBalanceSection] fetchBalance: Setting loading state');
    setBalance((prev) => ({ ...prev, loading: true, error: null }));

    console.log('[GemWalletBalanceSection] fetchBalance: Calling getExternalWalletBalanceAction...');
    const result = await getExternalWalletBalanceAction(address);
    console.log('[GemWalletBalanceSection] fetchBalance: Result:', result);

    if (result.success) {
      console.log('[GemWalletBalanceSection] fetchBalance: Success, updating balance');
      setBalance({
        xrp: result.xrp ?? 0,
        rlusd: result.rlusd ?? 0,
        rlusdConfigured: result.rlusdConfigured ?? false,
        loading: false,
        error: null,
      });
    } else {
      console.log('[GemWalletBalanceSection] fetchBalance: Error:', result.error);
      setBalance((prev) => ({
        ...prev,
        loading: false,
        error: result.error ?? null,
      }));
    }
  }, [address]);

  useEffect(() => {
    console.log('[GemWalletBalanceSection] useEffect: Setting mounted to true');
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('[GemWalletBalanceSection] useEffect: isConnected =', isConnected, 'address =', address);
    if (isConnected && address) {
      console.log('[GemWalletBalanceSection] useEffect: Fetching balance...');
      fetchBalance();
    }
  }, [isConnected, address, fetchBalance]);

  const shortenAddress = (addr: string): string => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  if (!mounted) {
    console.log('[GemWalletBalanceSection] Not mounted, showing skeleton');
    return <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />;
  }

  if (!isConnected || !address) {
    console.log('[GemWalletBalanceSection] Not connected or no address, returning empty');
    return <></>;
  }

  console.log('[GemWalletBalanceSection] Rendering balance card');

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <Card.Header className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
              <svg
                viewBox="0 0 40 40"
                className="w-5 h-5"
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
              <h3 className="text-sm font-semibold text-gray-900">GemWallet</h3>
              <p className="text-xs text-gray-500 font-mono">{shortenAddress(address)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {network && <Badge variant="info" className="text-xs">{network}</Badge>}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                console.log('[GemWalletBalanceSection] Refresh button clicked');
                fetchBalance();
              }}
              disabled={balance.loading}
            >
              {t('refreshBalance')}
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="pt-2">
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
      </Card.Body>
    </Card>
  );
}
