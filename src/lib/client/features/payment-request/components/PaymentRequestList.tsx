'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Table, Badge } from '@/components/ui';
import type { PaymentRequestItem } from '../action/payment-actions';

type PaymentRequestListProps = {
  paymentRequests: PaymentRequestItem[];
};

export function PaymentRequestList({ paymentRequests }: PaymentRequestListProps): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();

  const statusConfig = useMemo(
    () => ({
      PENDING: { label: t('payments.status.pending'), variant: 'warning' as const },
      PROCESSING: { label: t('payments.status.processing'), variant: 'info' as const },
      COMPLETED: { label: t('payments.status.completed'), variant: 'success' as const },
      FAILED: { label: t('payments.status.failed'), variant: 'danger' as const },
      CANCELLED: { label: t('paymentReceive.history.cancelled'), variant: 'default' as const },
    }),
    [t]
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'default' as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString(locale === 'ja-jp' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const formatCrypto = (amount: number, type: string): string => {
    return `${amount.toFixed(6)} ${type}`;
  };

  const network = process.env.NEXT_PUBLIC_XRPL_NETWORK ?? 'testnet';

  function getExplorerUrl(hash: string): string {
    if (network === 'mainnet') {
      return `https://livenet.xrpl.org/transactions/${hash}`;
    }
    return `https://testnet.xrpl.org/transactions/${hash}`;
  }

  if (paymentRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('paymentReceive.history.empty')}
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t('paymentReceive.history.receiveDate')}</Table.Head>
          <Table.Head>{t('paymentReceive.history.amountUsd')}</Table.Head>
          <Table.Head>{t('paymentReceive.history.crypto')}</Table.Head>
          <Table.Head>{t('paymentReceive.history.rate')}</Table.Head>
          <Table.Head>{t('paymentReceive.history.status')}</Table.Head>
          <Table.Head>{t('paymentReceive.history.transaction')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {paymentRequests.map((req) => (
          <Table.Row key={req.id}>
            <Table.Cell>{formatDateTime(req.createdAt)}</Table.Cell>
            <Table.Cell>{formatCurrency(req.amountUsd)}</Table.Cell>
            <Table.Cell>{formatCrypto(req.cryptoAmount, req.cryptoType)}</Table.Cell>
            <Table.Cell>
              1 {req.cryptoType} = ${req.cryptoRate.toFixed(4)}
            </Table.Cell>
            <Table.Cell>{getStatusBadge(req.status)}</Table.Cell>
            <Table.Cell>
              {req.transactionHash && !req.transactionHash.startsWith('DUMMY_TX_') ? (
                <a
                  href={getExplorerUrl(req.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-mono"
                >
                  {req.transactionHash.slice(0, 12)}...
                </a>
              ) : (
                formatDateTime(req.processedAt)
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
