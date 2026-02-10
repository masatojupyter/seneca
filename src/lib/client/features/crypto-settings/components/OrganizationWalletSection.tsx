'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrganizationWalletList } from '@/lib/client/features/crypto-settings/components/OrganizationWalletList';
import { AddOrganizationWalletForm } from '@/lib/client/features/crypto-settings/components/AddOrganizationWalletForm';
import {
  getOrganizationWalletsAction,
  createOrganizationWalletAction,
  updateOrganizationWalletAction,
  deleteOrganizationWalletAction,
} from '@/lib/client/features/crypto-settings/action/organization-wallet-actions';
import type { OrganizationWalletItem } from '@/lib/client/features/crypto-settings/action/organization-wallet-actions';

export function OrganizationWalletSection(): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const [wallets, setWallets] = useState<OrganizationWalletItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async (): Promise<void> => {
    const result = await getOrganizationWalletsAction();
    if (result.success && result.wallets) {
      setWallets(result.wallets);
    } else {
      setError(result.error ?? t('cryptoSettings.wallets.getFailed'));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreate = async (data: {
    cryptoType: 'XRP';
    walletAddress: string;
    walletSecret: string;
    label?: string;
    isDefault?: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    return createOrganizationWalletAction(data);
  };

  const handleCreateSuccess = async (): Promise<void> => {
    setShowAddForm(false);
    await fetchWallets();
    router.refresh();
  };

  const handleSetDefault = async (id: string): Promise<void> => {
    setError(null);
    const result = await updateOrganizationWalletAction({ id, isDefault: true });
    if (result.success) {
      await fetchWallets();
      router.refresh();
    } else {
      setError(result.error ?? t('cryptoSettings.wallets.updateFailed'));
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setError(null);
    const result = await deleteOrganizationWalletAction({ id });
    if (result.success) {
      await fetchWallets();
      router.refresh();
    } else {
      setError(result.error ?? t('cryptoSettings.wallets.deleteFailed'));
    }
  };

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('cryptoSettings.wallets.title')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t('cryptoSettings.wallets.description')}</p>
          </div>
          <Button
            size="sm"
            variant={showAddForm ? 'secondary' : 'primary'}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? t('common.cancel') : t('cryptoSettings.wallets.addWallet')}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <AddOrganizationWalletForm
              onSubmit={handleCreate}
              onSuccess={handleCreateSuccess}
              hasExistingWallets={wallets.length > 0}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : (
          <OrganizationWalletList
            wallets={wallets}
            onSetDefault={handleSetDefault}
            onDelete={handleDelete}
          />
        )}
      </Card.Body>
    </Card>
  );
}
