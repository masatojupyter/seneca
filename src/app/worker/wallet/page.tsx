'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading, Button, Alert } from '@/components/ui';
import {
  AddressList,
  AddAddressForm,
  WorkerGemWalletSection,
  getAddressesAction,
  createAddressAction,
  updateAddressAction,
  deleteAddressAction,
  type AddressItem,
} from '@/lib/client/features/wallet';

export default function WalletPage(): React.JSX.Element {
  const t = useTranslations();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAddresses = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await getAddressesAction();
      if (result.success && result.addresses) {
        setAddresses(result.addresses);
      } else {
        setError(result.error || t('wallet.getFailed'));
      }
    } catch (err) {
      console.error('Load addresses error:', err);
      setError(t('wallet.getFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetDefault = async (id: string): Promise<void> => {
    setError('');
    setSuccess('');
    try {
      const result = await updateAddressAction({ id, isDefault: true });
      if (result.success) {
        setSuccess(t('wallet.setDefaultSuccess'));
        setTimeout(() => setSuccess(''), 3000);
        loadAddresses();
      } else {
        setError(result.error || t('wallet.setDefaultFailed'));
      }
    } catch (err) {
      console.error('Set default error:', err);
      setError(t('common.unexpectedError'));
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setError('');
    setSuccess('');
    try {
      const result = await deleteAddressAction({ id });
      if (result.success) {
        setSuccess(t('wallet.deleteSuccess'));
        setTimeout(() => setSuccess(''), 3000);
        loadAddresses();
      } else {
        setError(result.error || t('wallet.deleteFailed'));
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('common.unexpectedError'));
    }
  };

  const handleAddSuccess = (): void => {
    setShowAddForm(false);
    loadAddresses();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('wallet.title')}</h1>
          <p className="text-gray-600 mt-1">{t('wallet.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? t('wallet.backToList') : t('wallet.addAddress')}
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <WorkerGemWalletSection
        onAddressImported={loadAddresses}
        existingAddresses={addresses.map((a) => ({
          cryptoType: a.cryptoType,
          address: a.address,
        }))}
      />

      {showAddForm ? (
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">{t('wallet.addNew')}</h2>
          </Card.Header>
          <Card.Body>
            <AddAddressForm
              onSubmit={createAddressAction}
              onSuccess={handleAddSuccess}
              hasExistingAddresses={addresses.length > 0}
            />
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <h2 className="text-xl font-semibold">{t('wallet.registeredAddresses')}</h2>
          </Card.Header>
          <Card.Body>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loading size="md" />
              </div>
            ) : (
              <AddressList
                addresses={addresses}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            )}
          </Card.Body>
        </Card>
      )}

      {!showAddForm && addresses.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {t('wallet.noAddresses')}
          </p>
          <Button variant="primary" onClick={() => setShowAddForm(true)}>
            {t('wallet.addFirst')}
          </Button>
        </div>
      )}
    </div>
  );
}
