'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Alert, Card, Select } from '@/components/ui';
import { ApprovedApplicationSelector } from './ApprovedApplicationSelector';
import { getExchangeRateAction } from '../action/payment-actions';
import type { ApprovedApplicationItem } from '../action/payment-actions';
import type { SelectOption } from '@/components/ui';
import type { CryptoType } from '@/lib/shared/entity';

type CreatePaymentRequestFormProps = {
  onSubmit: (data: {
    applicationIds: string[];
    cryptoType: CryptoType;
  }) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
  defaultCryptoType?: CryptoType;
};

export function CreatePaymentRequestForm({
  onSubmit,
  onSuccess,
  defaultCryptoType = 'XRP',
}: CreatePaymentRequestFormProps): React.JSX.Element {
  const [selectedApplications, setSelectedApplications] = useState<ApprovedApplicationItem[]>([]);
  const [cryptoType, setCryptoType] = useState<CryptoType>(defaultCryptoType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cryptoRate, setCryptoRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateError, setRateError] = useState('');

  const cryptoOptions: SelectOption[] = [
    { value: 'XRP', label: 'XRP' },
    { value: 'RLUSD', label: 'RLUSD (USDステーブルコイン)' },
  ];

  const fetchRate = useCallback(async (type: CryptoType) => {
    setRateLoading(true);
    setRateError('');
    const result = await getExchangeRateAction(type);
    if (result.success && result.rate) {
      setCryptoRate(result.rate);
    } else {
      setRateError(result.error ?? '為替レートの取得に失敗しました');
    }
    setRateLoading(false);
  }, []);

  useEffect(() => {
    fetchRate(cryptoType);
  }, [cryptoType, fetchRate]);

  const handleCryptoTypeChange = (newType: CryptoType) => {
    setCryptoType(newType);
  };

  const totalAmountUsd = selectedApplications.reduce((sum, app) => sum + app.totalAmountUsd, 0);
  const cryptoAmount = cryptoRate ? totalAmountUsd / cryptoRate : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedApplications.length === 0) {
      setError('申請を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        applicationIds: selectedApplications.map((app) => app.id),
        cryptoType,
      });

      if (result.success) {
        setSuccess('給与受領リクエストを作成しました');
        setSelectedApplications([]);
        setTimeout(() => {
          setSuccess('');
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || 'リクエストの作成に失敗しました');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">承認済み申請を選択</h3>
        </Card.Header>
        <Card.Body>
          <ApprovedApplicationSelector
            selectedApplications={selectedApplications}
            onSelectionChange={setSelectedApplications}
          />
        </Card.Body>
      </Card>

      {selectedApplications.length > 0 && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold">受領内容</h3>
          </Card.Header>
          <Card.Body className="space-y-4">
            <Select
              label="受け取る暗号資産"
              value={cryptoType}
              onChange={(e) => handleCryptoTypeChange(e.target.value as CryptoType)}
              options={cryptoOptions}
            />

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">選択した申請数</p>
                <p className="text-2xl font-bold">{selectedApplications.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">合計金額</p>
                <p className="text-2xl font-bold">${totalAmountUsd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">レート</p>
                {rateLoading ? (
                  <p className="text-xl font-semibold text-gray-400">取得中...</p>
                ) : rateError ? (
                  <p className="text-sm font-semibold text-red-600">{rateError}</p>
                ) : cryptoType === 'RLUSD' ? (
                  <p className="text-xl font-semibold">
                    1 RLUSD = $1.00 (固定)
                  </p>
                ) : (
                  <p className="text-xl font-semibold">
                    1 XRP = ${cryptoRate?.toFixed(4)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">受取数量</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cryptoRate ? `${cryptoAmount.toFixed(6)} ${cryptoType}` : '-'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {cryptoType === 'RLUSD'
                  ? '⚠️ RLUSDを受け取るにはトラストラインの設定が必要です。ウォレット設定でアドレスを確認してください。'
                  : '⚠️ デフォルトのXRPアドレスに送金されます。ウォレット設定でアドレスを確認してください。'
                }
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={selectedApplications.length === 0 || isSubmitting || !cryptoRate}
          isLoading={isSubmitting}
        >
          給与受領をリクエスト
        </Button>
      </div>
    </form>
  );
}
