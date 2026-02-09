'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import type { CryptoType } from '@/lib/shared/entity';

type AddAddressFormProps = {
  onSubmit: (data: {
    cryptoType: CryptoType;
    address: string;
    label?: string;
    isDefault?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  hasExistingAddresses: boolean;
};

export function AddAddressForm({ onSubmit, onSuccess, hasExistingAddresses }: AddAddressFormProps): React.JSX.Element {
  const t = useTranslations();
  const [cryptoType, setCryptoType] = useState<CryptoType>('XRP');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(!hasExistingAddresses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cryptoOptions: SelectOption[] = [
    { value: 'XRP', label: 'XRP' },
    { value: 'RLUSD', label: t('wallet.form.rlusdLabel') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        cryptoType,
        address,
        label: label || undefined,
        isDefault,
      });

      if (result.success) {
        setSuccess(t('wallet.form.addSuccess'));
        setAddress('');
        setLabel('');
        setTimeout(() => {
          setSuccess('');
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || t('wallet.form.addFailed'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <Select
        label={t('wallet.form.cryptoType')}
        value={cryptoType}
        onChange={(e) => setCryptoType(e.target.value as CryptoType)}
        options={cryptoOptions}
      />

      {cryptoType === 'RLUSD' && (
        <Alert variant="info">
          {t('wallet.form.rlusdTrustlineNote')}
        </Alert>
      )}

      <Input
        label={t('wallet.form.address')}
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={t('wallet.form.addressPlaceholder')}
        required
        helperText={t('wallet.form.addressHint')}
      />

      <Input
        label={t('wallet.form.label')}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('wallet.form.labelPlaceholder')}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={!hasExistingAddresses}
          className="w-4 h-4"
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700">
          {t('wallet.form.setAsDefault')}
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!address}
        >
          {t('common.add')}
        </Button>
      </div>
    </form>
  );
}
