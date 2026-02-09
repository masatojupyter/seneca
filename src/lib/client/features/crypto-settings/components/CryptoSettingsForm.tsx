'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateCryptoSettingAction } from '@/lib/client/features/crypto-settings/action/crypto-settings-actions';
import type { CryptoSettingData } from '@/lib/client/features/crypto-settings/action/crypto-settings-actions';

type CryptoSettingsFormProps = {
  setting: CryptoSettingData | null;
};

export function CryptoSettingsForm({ setting }: CryptoSettingsFormProps): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();

  const [autoPaymentEnabled, setAutoPaymentEnabled] = useState(setting?.autoPaymentEnabled ?? false);
  const [maxAutoPaymentUsd, setMaxAutoPaymentUsd] = useState(String(setting?.maxAutoPaymentUsd ?? '100'));
  const [dailyPaymentLimit, setDailyPaymentLimit] = useState(String(setting?.dailyPaymentLimit ?? '10'));
  const [dailyAmountLimitUsd, setDailyAmountLimitUsd] = useState(setting?.dailyAmountLimitUsd != null ? String(setting.dailyAmountLimitUsd) : '');
  const [newAddressLockHours, setNewAddressLockHours] = useState(String(setting?.newAddressLockHours ?? '0'));
  const [require2FA, setRequire2FA] = useState(setting?.require2FA ?? false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await updateCryptoSettingAction({
        autoPaymentEnabled,
        maxAutoPaymentUsd: Number(maxAutoPaymentUsd),
        dailyPaymentLimit: Number(dailyPaymentLimit),
        dailyAmountLimitUsd: dailyAmountLimitUsd ? Number(dailyAmountLimitUsd) : null,
        newAddressLockHours: Number(newAddressLockHours),
        require2FA,
      });

      if (result.success) {
        setSuccessMessage(t('cryptoSettings.updateSuccess'));
        router.refresh();
      } else {
        setError(result.error ?? t('cryptoSettings.updateFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">{t('cryptoSettings.form.autoPayment')}</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="autoPaymentEnabled"
                type="checkbox"
                checked={autoPaymentEnabled}
                onChange={(e) => setAutoPaymentEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoPaymentEnabled" className="text-sm font-medium text-gray-700">
                {t('cryptoSettings.form.enableAutoPayment')}
              </label>
            </div>

            {autoPaymentEnabled && (
              <>
                <Input
                  label={t('cryptoSettings.form.maxAutoPaymentAmount')}
                  type="number"
                  value={maxAutoPaymentUsd}
                  onChange={(e) => setMaxAutoPaymentUsd(e.target.value)}
                  min="0"
                  step="0.01"
                  helperText={t('cryptoSettings.form.maxAutoPaymentHint')}
                />

                <Input
                  label={t('cryptoSettings.form.dailyPaymentLimit')}
                  type="number"
                  value={dailyPaymentLimit}
                  onChange={(e) => setDailyPaymentLimit(e.target.value)}
                  min="1"
                  step="1"
                />
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">{t('cryptoSettings.form.securitySettings')}</h2>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Input
              label={t('cryptoSettings.form.dailyWithdrawLimit')}
              type="number"
              value={dailyAmountLimitUsd}
              onChange={(e) => setDailyAmountLimitUsd(e.target.value)}
              min="0"
              step="0.01"
              placeholder={t('common.notSet')}
              helperText={t('cryptoSettings.form.dailyWithdrawHint')}
            />

            <Input
              label={t('cryptoSettings.form.newAddressLockTime')}
              type="number"
              value={newAddressLockHours}
              onChange={(e) => setNewAddressLockHours(e.target.value)}
              min="0"
              step="1"
              helperText={t('cryptoSettings.form.newAddressLockHint')}
            />

            <div className="flex items-center gap-3">
              <input
                id="require2FA"
                type="checkbox"
                checked={require2FA}
                onChange={(e) => setRequire2FA(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="require2FA" className="text-sm font-medium text-gray-700">
                {t('cryptoSettings.form.require2fa')}
              </label>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {t('cryptoSettings.form.saveButton')}
        </Button>
      </div>
    </form>
  );
}
