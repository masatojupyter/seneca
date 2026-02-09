'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading } from '@/components/ui';
import type { AvailableBalanceData } from '../action/timestamp-actions';

type AvailableBalanceProps = {
  onGetBalance: () => Promise<{ success: boolean; error?: string; balance?: AvailableBalanceData }>;
};

export const AvailableBalance = memo(function AvailableBalance({ onGetBalance }: AvailableBalanceProps): React.JSX.Element {
  const t = useTranslations();
  const [balance, setBalance] = useState<AvailableBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const onGetBalanceRef = useRef(onGetBalance);
  onGetBalanceRef.current = onGetBalance;

  useEffect(() => {
    let isMounted = true;

    const loadBalance = async (): Promise<void> => {
      try {
        const result = await onGetBalanceRef.current();
        if (isMounted && result.success && result.balance) {
          setBalance(result.balance);
        }
      } catch (error) {
        console.error('Load balance error:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadBalance();

    // 30秒ごとに更新（為替レート変動対応）
    const interval = setInterval(loadBalance, 30000);

    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const formatUsd = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCrypto = (amount: number, cryptoType: string): string => {
    return `${amount.toFixed(6)} ${cryptoType}`;
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('availableBalance.title')}</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h2 className="text-xl font-semibold">{t('availableBalance.title')}</h2>
      </Card.Header>
      <Card.Body>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">{t('availableBalance.usdEquivalent')}</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {balance ? formatUsd(balance.totalAmountUsd) : '$0.00'}
            </p>
          </div>
          {balance && balance.totalAmountUsd > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">{t('availableBalance.cryptoEquivalent')}</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {formatCrypto(balance.cryptoAmount, balance.cryptoType)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('availableBalance.rate', { crypto: balance.cryptoType, rate: formatUsd(balance.exchangeRate) })}
              </p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
});
