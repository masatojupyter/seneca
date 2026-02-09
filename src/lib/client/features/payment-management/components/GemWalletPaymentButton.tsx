'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGemWallet } from '@/lib/client/hooks/use-gem-wallet';
import { completeGemWalletPaymentAction } from '../action/payment-actions';

type GemWalletPaymentButtonProps = {
  paymentRequestId: string;
  status: string;
  destinationAddress: string;
  cryptoType: string;
  cryptoAmount: number;
  dataHash: string | null;
  tokenIssuer?: string;
  tokenCurrencyCode?: string;
  organizationWalletAddress?: string;
};

export function GemWalletPaymentButton({
  paymentRequestId,
  status,
  destinationAddress,
  cryptoType,
  cryptoAmount,
  dataHash,
  tokenIssuer,
  tokenCurrencyCode,
  organizationWalletAddress,
}: GemWalletPaymentButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const gemWallet = useGemWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'connecting' | 'signing' | 'confirming'>('idle');

  const isPending = status === 'PENDING';
  const isProcessing = status === 'PROCESSING';

  // GemWalletが組織ウォレットのアドレスと一致するかチェック
  const isWalletMatched = organizationWalletAddress &&
    gemWallet.address?.toLowerCase() === organizationWalletAddress.toLowerCase();

  async function handleConnect() {
    setError(null);
    setStep('connecting');
    const success = await gemWallet.connect();
    if (!success) {
      setError(gemWallet.error || t('gemwallet.connectionFailed'));
    }
    setStep('idle');
  }

  async function handleExecute() {
    setError(null);
    setIsExecuting(true);
    setStep('signing');

    try {
      // XRPの場合はdropsに変換、RLUSDの場合はそのまま
      let amount: string;
      if (cryptoType === 'XRP') {
        // XRPをdropsに変換（1 XRP = 1,000,000 drops）
        const drops = Math.floor(cryptoAmount * 1_000_000);
        amount = drops.toString();
      } else {
        // RLUSDなどのトークンはそのまま
        amount = cryptoAmount.toFixed(6);
      }

      // メモデータを作成
      const memos = dataHash ? [{
        memoType: 'seneca/payment',
        memoData: JSON.stringify({ paymentRequestId, dataHash }),
      }] : [];

      // GemWalletで送金実行
      const result = await gemWallet.sendPayment({
        destination: destinationAddress,
        amount,
        currency: cryptoType === 'XRP' ? undefined : tokenCurrencyCode,
        issuer: cryptoType === 'XRP' ? undefined : tokenIssuer,
        memos,
      });

      if (!result.success || !result.hash) {
        setError(result.error || t('gemwallet.paymentFailed'));
        setStep('idle');
        setIsExecuting(false);
        return;
      }

      // サーバーに結果を報告
      setStep('confirming');
      const serverResult = await completeGemWalletPaymentAction({
        paymentRequestId,
        transactionHash: result.hash,
      });

      if (serverResult.success) {
        setShowConfirmModal(false);
        router.refresh();
      } else {
        setError(serverResult.error || t('payments.execute.failed'));
      }
    } catch (err) {
      console.error('[GemWalletPaymentButton] Error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsExecuting(false);
      setStep('idle');
    }
  }

  if (isProcessing) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
        {t('payments.execute.processing')}
      </div>
    );
  }

  if (!isPending) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-center">
        {t('payments.execute.alreadyProcessed')}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* GemWallet接続状態 */}
        {!gemWallet.isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {t('gemwallet.connectToExecute')}
            </p>
            <button
              onClick={handleConnect}
              disabled={gemWallet.isConnecting}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {gemWallet.isConnecting ? t('gemwallet.connecting') : t('gemwallet.connect')}
            </button>
            {!gemWallet.isInstalled && (
              <p className="text-xs text-orange-600">
                {t('gemwallet.notInstalled')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* 接続済みアドレス表示 */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-600 mb-1">{t('gemwallet.connectedAs')}</div>
              <div className="font-mono text-sm text-green-800 truncate">
                {gemWallet.address}
              </div>
              {gemWallet.network && (
                <div className="text-xs text-green-600 mt-1">
                  Network: {gemWallet.network}
                </div>
              )}
            </div>

            {/* アドレス不一致警告 */}
            {organizationWalletAddress && !isWalletMatched && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                {t('gemwallet.addressMismatch')}
                <div className="font-mono text-xs mt-1 break-all">
                  {t('gemwallet.expectedAddress')}: {organizationWalletAddress}
                </div>
              </div>
            )}

            {/* 支払い実行ボタン */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isExecuting || Boolean(organizationWalletAddress && !isWalletMatched)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {t('gemwallet.executePayment')}
            </button>

            {/* 切断ボタン */}
            <button
              onClick={gemWallet.disconnect}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              {t('gemwallet.disconnect')}
            </button>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          {t('gemwallet.paymentDescription')}
        </div>
      </div>

      {/* 確認モーダル */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('gemwallet.confirmTitle')}</h3>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">{t('payments.detail.destinationAddress')}</div>
                <div className="font-mono text-sm break-all">{destinationAddress}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">{t('payments.detail.transferAmount')}</div>
                <div className="text-lg font-bold text-blue-600">
                  {cryptoAmount.toFixed(6)} {cryptoType}
                </div>
              </div>
            </div>

            {step !== 'idle' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm mb-4">
                {step === 'connecting' && t('gemwallet.stepConnecting')}
                {step === 'signing' && t('gemwallet.stepSigning')}
                {step === 'confirming' && t('gemwallet.stepConfirming')}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setError(null);
                }}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? t('gemwallet.executing') : t('gemwallet.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
