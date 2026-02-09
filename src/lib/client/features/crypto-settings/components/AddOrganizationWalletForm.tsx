'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';

type AddOrganizationWalletFormProps = {
  onSubmit: (data: {
    cryptoType: 'XRP';
    walletAddress: string;
    walletSecret: string;
    label?: string;
    isDefault?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  hasExistingWallets: boolean;
};

export function AddOrganizationWalletForm({
  onSubmit,
  onSuccess,
  hasExistingWallets,
}: AddOrganizationWalletFormProps): React.JSX.Element {
  const t = useTranslations();
  const [cryptoType] = useState<'XRP'>('XRP');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletSecret, setWalletSecret] = useState('');
  const [label, setLabel] = useState('');
  const [isDefault, setIsDefault] = useState(!hasExistingWallets);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cryptoOptions: SelectOption[] = [
    { value: 'XRP', label: 'XRP' },
  ];

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        cryptoType,
        walletAddress,
        walletSecret,
        label: label || undefined,
        isDefault,
      });

      if (result.success) {
        setSuccess(t('cryptoSettings.addWallet.addSuccess'));
        setWalletAddress('');
        setWalletSecret('');
        setLabel('');
        setTimeout(() => {
          setSuccess('');
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || t('cryptoSettings.addWallet.addFailed'));
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
        label={t('cryptoSettings.addWallet.cryptoType')}
        value={cryptoType}
        options={cryptoOptions}
        disabled
      />

      <Input
        label={t('cryptoSettings.addWallet.walletAddress')}
        type="text"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder={t('cryptoSettings.addWallet.addressPlaceholder')}
        required
        helperText={t('cryptoSettings.addWallet.addressHint')}
      />

      <Input
        label={t('cryptoSettings.addWallet.walletSecret')}
        type="password"
        value={walletSecret}
        onChange={(e) => setWalletSecret(e.target.value)}
        placeholder={t('cryptoSettings.addWallet.secretPlaceholder')}
        required
        helperText={t('cryptoSettings.addWallet.secretHint')}
      />

      <Input
        label={t('cryptoSettings.addWallet.label')}
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('cryptoSettings.addWallet.labelPlaceholder')}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="walletIsDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          disabled={!hasExistingWallets}
          className="w-4 h-4"
        />
        <label htmlFor="walletIsDefault" className="text-sm text-gray-700">
          {t('cryptoSettings.addWallet.setAsDefault')}
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!walletAddress || !walletSecret}
        >
          {t('common.add')}
        </Button>
      </div>
    </form>
  );
}
