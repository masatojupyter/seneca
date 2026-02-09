'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading, Alert, Button } from '@/components/ui';
import {
  ApprovedApplicationSelector,
  PaymentRequestList,
  getPaymentRequestsAction,
  getExchangeRateAction,
  receivePaymentAction,
  type ApprovedApplicationItem,
  type PaymentRequestItem,
} from '@/lib/client/features/payment-request';
import type { CryptoType } from '@/lib/shared/entity';

const XRPL_NETWORK = process.env.NEXT_PUBLIC_XRPL_NETWORK ?? 'testnet';

function getExplorerTxUrl(hash: string): string {
  if (XRPL_NETWORK === 'mainnet') {
    return `https://livenet.xrpl.org/transactions/${hash}`;
  }
  return `https://testnet.xrpl.org/transactions/${hash}`;
}

export default function PaymentPage(): React.JSX.Element {
  const t = useTranslations();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<ApprovedApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState(false);
  const [selectedCryptoType, setSelectedCryptoType] = useState<CryptoType>('XRP');
  const [cryptoRate, setCryptoRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{
    transactionHash: string | null;
    amountUsd: number;
    cryptoAmount: number;
    cryptoType: CryptoType;
    destinationAddress: string;
    requiresManualSigning: boolean;
  } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPaymentRequestsAction();
      if (result.success && result.paymentRequests) {
        setPaymentRequests(result.paymentRequests);
      }
    } catch (err) {
      console.error('Load payment requests error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExchangeRate = useCallback(async (cryptoType: CryptoType) => {
    setRateLoading(true);
    const result = await getExchangeRateAction(cryptoType);
    if (result.success && result.rate) {
      setCryptoRate(result.rate);
    } else {
      setCryptoRate(null);
    }
    setRateLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    loadExchangeRate(selectedCryptoType);
  }, [loadData, loadExchangeRate, selectedCryptoType]);

  const totalAmountUsd = selectedApplications.reduce(
    (sum, app) => sum + app.totalAmountUsd,
    0
  );
  const cryptoAmount = cryptoRate ? totalAmountUsd / cryptoRate : 0;

  async function handleReceive(): Promise<void> {
    if (selectedApplications.length === 0) {
      setError(t('paymentReceive.selectAtLeastOne'));
      return;
    }

    setError('');
    setSuccessResult(null);
    setIsReceiving(true);

    try {
      const result = await receivePaymentAction({
        applicationIds: selectedApplications.map((app) => app.id),
        cryptoType: selectedCryptoType,
      });

      if (result.success) {
        setSuccessResult({
          transactionHash: result.transactionHash ?? null,
          amountUsd: result.amountUsd ?? 0,
          cryptoAmount: result.cryptoAmount ?? 0,
          cryptoType: selectedCryptoType,
          destinationAddress: result.destinationAddress ?? '',
          requiresManualSigning: result.requiresManualSigning ?? false,
        });
        setSelectedApplications([]);
        await loadData();
      } else {
        setError(result.error ?? t('paymentReceive.receiveFailed'));
      }
    } catch (err) {
      console.error('Receive payment error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsReceiving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('paymentReceive.title')}</h1>
        <p className="text-gray-600 mt-1">
          {t('paymentReceive.subtitle')}
        </p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successResult && (
        <Card>
          {successResult.requiresManualSigning ? (
            // GemWalletモード: 管理者の承認待ち
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                {t('paymentReceive.pendingApproval.title')}
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                {t('paymentReceive.pendingApproval.message')}
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-yellow-700">{t('paymentReceive.completeDetails.amount')}</dt>
                  <dd className="font-semibold">
                    ${successResult.amountUsd.toFixed(2)} ({successResult.cryptoType === 'RLUSD' ? successResult.cryptoAmount.toFixed(2) : successResult.cryptoAmount.toFixed(6)} {successResult.cryptoType})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-yellow-700">{t('paymentReceive.completeDetails.destination')}</dt>
                  <dd className="font-mono text-xs">
                    {successResult.destinationAddress}
                  </dd>
                </div>
              </dl>
              <button
                onClick={() => setSuccessResult(null)}
                className="mt-4 text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            // ホットウォレットモード: 即時送金完了
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                {t('paymentReceive.receiveComplete')}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-green-700">{t('paymentReceive.completeDetails.amount')}</dt>
                  <dd className="font-semibold">
                    ${successResult.amountUsd.toFixed(2)} ({successResult.cryptoType === 'RLUSD' ? successResult.cryptoAmount.toFixed(2) : successResult.cryptoAmount.toFixed(6)} {successResult.cryptoType})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-green-700">{t('paymentReceive.completeDetails.destination')}</dt>
                  <dd className="font-mono text-xs">
                    {successResult.destinationAddress}
                  </dd>
                </div>
                {successResult.transactionHash && (
                  <div className="flex justify-between items-center">
                    <dt className="text-green-700">{t('paymentReceive.completeDetails.transaction')}</dt>
                    <dd>
                      <a
                        href={getExplorerTxUrl(successResult.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-xs"
                      >
                        {successResult.transactionHash.slice(0, 20)}...
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <button
                onClick={() => setSuccessResult(null)}
                className="mt-4 text-sm text-green-700 hover:text-green-900 underline"
              >
                {t('common.close')}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* 通貨選択 */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('paymentReceive.cryptoSelect.title')}</h2>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-4">
            <Button
              variant={selectedCryptoType === 'XRP' ? 'primary' : 'secondary'}
              onClick={() => setSelectedCryptoType('XRP')}
              className="flex-1"
            >
              <div className="text-center">
                <div className="font-semibold">XRP</div>
                <div className="text-xs opacity-75">{t('paymentReceive.cryptoSelect.xrpDesc')}</div>
              </div>
            </Button>
            <Button
              variant={selectedCryptoType === 'RLUSD' ? 'primary' : 'secondary'}
              onClick={() => setSelectedCryptoType('RLUSD')}
              className="flex-1"
            >
              <div className="text-center">
                <div className="font-semibold">RLUSD</div>
                <div className="text-xs opacity-75">{t('paymentReceive.cryptoSelect.rlusdDesc')}</div>
              </div>
            </Button>
          </div>
          {selectedCryptoType === 'RLUSD' && (
            <Alert variant="info" className="mt-4">
              {t('paymentReceive.cryptoSelect.rlusdNote')}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* 受領可能な承認済み申請 */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('paymentReceive.availableApplications')}</h2>
        </Card.Header>
        <Card.Body>
          <ApprovedApplicationSelector
            selectedApplications={selectedApplications}
            onSelectionChange={setSelectedApplications}
          />
        </Card.Body>
      </Card>

      {/* 受領概要 + ボタン */}
      {selectedApplications.length > 0 && (
        <Card>
          <Card.Body className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">{t('paymentReceive.summary.selectedApplications')}</p>
                <p className="text-2xl font-bold">{selectedApplications.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('paymentReceive.summary.totalAmount')}</p>
                <p className="text-2xl font-bold">${totalAmountUsd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('paymentReceive.summary.rate')}</p>
                {rateLoading ? (
                  <p className="text-xl font-semibold text-gray-400">{t('paymentReceive.summary.fetching')}</p>
                ) : cryptoRate ? (
                  <p className="text-xl font-semibold">
                    1 {selectedCryptoType} = ${selectedCryptoType === 'RLUSD' ? '1.00' : cryptoRate.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-sm text-red-600">{t('paymentReceive.summary.fetchFailed')}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('paymentReceive.summary.receiveAmount')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cryptoRate ? `${selectedCryptoType === 'RLUSD' ? cryptoAmount.toFixed(2) : cryptoAmount.toFixed(6)} ${selectedCryptoType}` : '-'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                {t('paymentReceive.summary.notice')}
              </p>
            </div>

            <button
              onClick={handleReceive}
              disabled={isReceiving || !cryptoRate}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {isReceiving
                ? t('paymentReceive.summary.receiving')
                : t('paymentReceive.summary.receiveButtonWithCrypto', { crypto: selectedCryptoType })}
            </button>
          </Card.Body>
        </Card>
      )}

      {/* 受領履歴 */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('paymentReceive.history.title')}</h2>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : (
            <PaymentRequestList paymentRequests={paymentRequests} />
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
