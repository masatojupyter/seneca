'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import {
  getTokenIssuerConfigsAction,
  createTokenIssuerConfigAction,
  updateTokenIssuerConfigAction,
  deleteTokenIssuerConfigAction,
} from '@/lib/client/features/crypto-settings/action/token-issuer-config-actions';
import type { TokenIssuerConfigItem } from '@/lib/client/features/crypto-settings/action/token-issuer-config-actions';
import type { CryptoType } from '@/lib/shared/entity';

export function TokenIssuerConfigSection(): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const [configs, setConfigs] = useState<TokenIssuerConfigItem[]>([]);
  const [envConfigured, setEnvConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    cryptoType: 'RLUSD' as CryptoType,
    issuerAddress: '',
    currencyCode: 'RLUSD',
    network: 'testnet' as 'mainnet' | 'testnet',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfigs = useCallback(async (): Promise<void> => {
    const result = await getTokenIssuerConfigsAction();
    if (result.success) {
      setConfigs(result.configs ?? []);
      setEnvConfigured(result.envConfigured ?? false);
    } else {
      setError(result.error ?? t('cryptoSettings.tokenIssuer.getFailed'));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const result = await createTokenIssuerConfigAction(formData);
    if (result.success) {
      setSuccess(t('cryptoSettings.tokenIssuer.createSuccess'));
      setShowAddForm(false);
      setFormData({
        cryptoType: 'RLUSD',
        issuerAddress: '',
        currencyCode: 'RLUSD',
        network: 'testnet',
      });
      await fetchConfigs();
      router.refresh();
    } else {
      setError(result.error ?? t('cryptoSettings.tokenIssuer.createFailed'));
    }
    setIsSubmitting(false);
  };

  const handleToggleActive = async (config: TokenIssuerConfigItem): Promise<void> => {
    setError(null);
    const result = await updateTokenIssuerConfigAction({
      cryptoType: config.cryptoType,
      isActive: !config.isActive,
    });
    if (result.success) {
      await fetchConfigs();
      router.refresh();
    } else {
      setError(result.error ?? t('cryptoSettings.tokenIssuer.updateFailed'));
    }
  };

  const handleDelete = async (cryptoType: CryptoType): Promise<void> => {
    if (!confirm(t('cryptoSettings.tokenIssuer.deleteConfirm'))) {
      return;
    }
    setError(null);
    const result = await deleteTokenIssuerConfigAction(cryptoType);
    if (result.success) {
      setSuccess(t('cryptoSettings.tokenIssuer.deleteSuccess'));
      await fetchConfigs();
      router.refresh();
    } else {
      setError(result.error ?? t('cryptoSettings.tokenIssuer.deleteFailed'));
    }
  };

  const rlusdConfig = configs.find((c) => c.cryptoType === 'RLUSD');
  const hasRlusdConfig = !!rlusdConfig;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('cryptoSettings.tokenIssuer.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('cryptoSettings.tokenIssuer.subtitle')}
            </p>
          </div>
          {!hasRlusdConfig && !envConfigured && (
            <Button
              size="sm"
              variant={showAddForm ? 'secondary' : 'primary'}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? t('common.cancel') : t('cryptoSettings.tokenIssuer.addConfig')}
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="error" onClose={() => setError(null)} className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} className="mb-4">
            {success}
          </Alert>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <Input
              label={t('cryptoSettings.tokenIssuer.issuerAddress')}
              value={formData.issuerAddress}
              onChange={(e) => setFormData({ ...formData, issuerAddress: e.target.value })}
              placeholder="r..."
              required
              helperText={t('cryptoSettings.tokenIssuer.issuerAddressHint')}
            />

            <Input
              label={t('cryptoSettings.tokenIssuer.currencyCode')}
              value={formData.currencyCode}
              onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
              placeholder="RLUSD"
              required
            />

            <Select
              label={t('cryptoSettings.tokenIssuer.network')}
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value as 'mainnet' | 'testnet' })}
              options={[
                { value: 'testnet', label: 'Testnet' },
                { value: 'mainnet', label: 'Mainnet' },
              ]}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddForm(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={!formData.issuerAddress || !formData.currencyCode}
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : hasRlusdConfig ? (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">RLUSD</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        rlusdConfig.source === 'env'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {rlusdConfig.source === 'env'
                        ? t('cryptoSettings.tokenIssuer.sourceEnv')
                        : t('cryptoSettings.tokenIssuer.sourceDb')}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        rlusdConfig.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {rlusdConfig.isActive
                        ? t('common.active')
                        : t('common.inactive')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">{t('cryptoSettings.tokenIssuer.issuerAddress')}:</span>{' '}
                      <code className="bg-gray-100 px-1 rounded text-xs">
                        {rlusdConfig.issuerAddress}
                      </code>
                    </p>
                    <p>
                      <span className="font-medium">{t('cryptoSettings.tokenIssuer.currencyCode')}:</span>{' '}
                      {rlusdConfig.currencyCode}
                    </p>
                    <p>
                      <span className="font-medium">{t('cryptoSettings.tokenIssuer.network')}:</span>{' '}
                      <span className="capitalize">{rlusdConfig.network}</span>
                    </p>
                  </div>
                </div>
                {rlusdConfig.source === 'db' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleActive(rlusdConfig)}
                    >
                      {rlusdConfig.isActive
                        ? t('common.deactivate')
                        : t('common.activate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(rlusdConfig.cryptoType)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
              </div>
              {rlusdConfig.source === 'env' && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  {t('cryptoSettings.tokenIssuer.envNote')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>{t('cryptoSettings.tokenIssuer.noConfig')}</p>
            <p className="mt-2 text-sm">
              {t('cryptoSettings.tokenIssuer.noConfigHint')}
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
