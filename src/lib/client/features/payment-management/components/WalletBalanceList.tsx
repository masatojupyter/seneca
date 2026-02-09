'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import type { WalletBalanceItemData } from '@/lib/client/features/payment-management/action/wallet-balance-actions';

type WalletBalanceListProps = {
  wallets: WalletBalanceItemData[];
  xrpUsdRate: number;
  network: string;
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

function shortenAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

export function WalletBalanceList({
  wallets,
  xrpUsdRate,
  network,
}: WalletBalanceListProps): React.JSX.Element {
  const t = useTranslations();
  const isTestnet = network === 'testnet';
  if (wallets.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          {t('walletBalance.noWallets')}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold">{t('walletBalance.perWallet')}</h3>
      </Card.Header>
      <Table>
        <Table.Header>
          <Table.Row>
            {isTestnet && <Table.Head>{t('walletBalance.network')}</Table.Head>}
            <Table.Head>{t('walletBalance.label')}</Table.Head>
            <Table.Head>{t('walletBalance.address')}</Table.Head>
            <Table.Head className="text-right">{t('walletBalance.xrpBalance')}</Table.Head>
            <Table.Head className="text-right">{t('walletBalance.usdBalance')}</Table.Head>
            <Table.Head>{t('common.status')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {wallets.map((wallet) => (
            <Table.Row
              key={wallet.id}
              className={wallet.balanceXrp === 0 ? 'opacity-50' : ''}
            >
              {isTestnet && (
                <Table.Cell>
                  <Badge variant="warning">Testnet</Badge>
                </Table.Cell>
              )}
              <Table.Cell>
                <span className="text-sm font-medium text-gray-900">
                  {wallet.label ?? '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-sm font-mono text-gray-600">
                  {shortenAddress(wallet.walletAddress)}
                </span>
              </Table.Cell>
              <Table.Cell className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {formatXrp(wallet.balanceXrp)}
                </span>
              </Table.Cell>
              <Table.Cell className="text-right">
                <span className="text-sm text-gray-600">
                  {xrpUsdRate > 0 ? `$${formatUsd(wallet.balanceUsd)}` : '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                {wallet.isDefault && (
                  <Badge variant="info">{t('common.default')}</Badge>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
