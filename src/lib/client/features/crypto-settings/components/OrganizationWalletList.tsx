'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Table, Badge, Button } from '@/components/ui';
import { getWalletBalanceAction } from '@/lib/client/features/crypto-settings/action/organization-wallet-actions';
import type { OrganizationWalletItem } from '@/lib/client/features/crypto-settings/action/organization-wallet-actions';

type WalletBalance = {
  xrp: number;
  rlusd: number;
  rlusdConfigured: boolean;
  loading: boolean;
  error: string | null;
};

type OrganizationWalletListProps = {
  wallets: OrganizationWalletItem[];
  onSetDefault: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function OrganizationWalletList({
  wallets,
  onSetDefault,
  onDelete,
}: OrganizationWalletListProps): React.JSX.Element {
  const t = useTranslations();
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});

  useEffect(() => {
    const fetchBalances = async (): Promise<void> => {
      for (const wallet of wallets) {
        setBalances((prev) => ({
          ...prev,
          [wallet.walletAddress]: {
            xrp: 0,
            rlusd: 0,
            rlusdConfigured: false,
            loading: true,
            error: null,
          },
        }));

        const result = await getWalletBalanceAction(wallet.walletAddress);
        setBalances((prev) => ({
          ...prev,
          [wallet.walletAddress]: {
            xrp: result.xrp ?? 0,
            rlusd: result.rlusd ?? 0,
            rlusdConfigured: result.rlusdConfigured ?? false,
            loading: false,
            error: result.success ? null : (result.error ?? null),
          },
        }));
      }
    };

    if (wallets.length > 0) {
      fetchBalances();
    }
  }, [wallets]);

  const handleDelete = async (id: string, isDefault: boolean): Promise<void> => {
    if (isDefault) {
      alert(t('cryptoSettings.walletList.cannotDeleteDefault'));
      return;
    }

    if (!confirm(t('cryptoSettings.walletList.deleteConfirm'))) {
      return;
    }

    await onDelete(id);
  };

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('cryptoSettings.walletList.empty')}
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t('cryptoSettings.walletList.label')}</Table.Head>
          <Table.Head>{t('cryptoSettings.walletList.crypto')}</Table.Head>
          <Table.Head>{t('cryptoSettings.walletList.address')}</Table.Head>
          <Table.Head>{t('cryptoSettings.walletList.balance')}</Table.Head>
          <Table.Head>{t('common.status')}</Table.Head>
          <Table.Head>{t('common.actions')}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {wallets.map((wallet) => {
          const balance = balances[wallet.walletAddress];
          return (
            <Table.Row key={wallet.id}>
              <Table.Cell>{wallet.label || '-'}</Table.Cell>
              <Table.Cell>
                <Badge variant="info">{wallet.cryptoType}</Badge>
              </Table.Cell>
              <Table.Cell className="font-mono text-sm">{wallet.walletAddress}</Table.Cell>
              <Table.Cell>
                {balance?.loading ? (
                  <span className="text-gray-400 text-sm">{t('common.loading')}</span>
                ) : balance?.error ? (
                  <span className="text-red-500 text-sm">-</span>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{balance?.xrp?.toFixed(2) ?? '-'}</span>
                      <span className="text-gray-500 text-sm">XRP</span>
                    </div>
                    {balance?.rlusdConfigured && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{balance?.rlusd?.toFixed(2) ?? '-'}</span>
                        <span className="text-gray-500 text-sm">RLUSD</span>
                      </div>
                    )}
                  </div>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  {wallet.isDefault && <Badge variant="success">{t('common.default')}</Badge>}
                  {wallet.isActive ? (
                    <Badge variant="success">{t('common.enabled')}</Badge>
                  ) : (
                    <Badge variant="default">{t('common.disabled')}</Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  {!wallet.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSetDefault(wallet.id)}
                    >
                      {t('cryptoSettings.walletList.setDefault')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(wallet.id, wallet.isDefault)}
                    disabled={wallet.isDefault}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
