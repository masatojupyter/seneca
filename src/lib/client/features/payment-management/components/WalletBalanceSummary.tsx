'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import type { WalletBalanceSummaryData } from '@/lib/client/features/payment-management/action/wallet-balance-actions';

type WalletBalanceSummaryProps = {
  summary: WalletBalanceSummaryData[];
  totalUsd: number;
  xrpUsdRate: number;
  rateUpdatedAt: string;
};

function formatXrp(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function WalletBalanceSummary({
  summary,
  totalUsd,
  xrpUsdRate,
  rateUpdatedAt,
}: WalletBalanceSummaryProps): React.JSX.Element {
  const t = useTranslations();
  const xrpSummary = summary.find((s) => s.cryptoType === 'XRP');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('walletBalance.summary.totalXrp')}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {xrpSummary ? formatXrp(xrpSummary.totalBalance) : '0'}
          </div>
          <div className="mt-1 text-sm text-gray-500">XRP</div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('walletBalance.summary.totalUsd')}</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            ${formatUsd(totalUsd)}
          </div>
          <div className="mt-1 text-sm text-gray-500">USD</div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-600">{t('walletBalance.summary.rate')}</div>
          {xrpUsdRate > 0 ? (
            <>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                ${formatUsd(xrpUsdRate)}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {t('walletBalance.summary.rateUpdated', { time: formatTime(rateUpdatedAt) })}
              </div>
            </>
          ) : (
            <>
              <div className="mt-2 text-xl font-bold text-gray-400">-</div>
              <div className="mt-1 text-sm text-gray-500">
                {t('walletBalance.summary.rateFailed')}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
