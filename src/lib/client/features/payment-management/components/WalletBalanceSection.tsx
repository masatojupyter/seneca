'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getWalletBalancesAction } from '@/lib/client/features/payment-management/action/wallet-balance-actions';
import type { WalletBalancesData } from '@/lib/client/features/payment-management/action/wallet-balance-actions';
import { WalletBalanceSummary } from '@/lib/client/features/payment-management/components/WalletBalanceSummary';
import { WalletBalanceList } from '@/lib/client/features/payment-management/components/WalletBalanceList';

export function WalletBalanceSection(): React.JSX.Element {
  const t = useTranslations();
  const [data, setData] = useState<WalletBalancesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWalletBalancesAction();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error ?? t('walletBalance.getFailed'));
      }
    } catch {
      setError(t('walletBalance.getFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('walletBalance.title')}</h2>
        <button
          type="button"
          onClick={fetchBalances}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('walletBalance.fetching') : t('walletBalance.refresh')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && !data && (
        <div className="py-8 text-center text-gray-500">
          {t('walletBalance.fetchingBalance')}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <WalletBalanceSummary
            summary={data.summary}
            totalUsd={data.totalUsd}
            xrpUsdRate={data.xrpUsdRate}
            rateUpdatedAt={data.rateUpdatedAt}
          />
          <WalletBalanceList
            wallets={data.wallets}
            xrpUsdRate={data.xrpUsdRate}
            network={data.network}
          />
        </div>
      )}
    </div>
  );
}
