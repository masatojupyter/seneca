'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { isInstalled, getAddress, getNetwork, getPublicKey, sendPayment as gemSendPayment } from '@gemwallet/api';
import type { SendPaymentRequest } from '@gemwallet/api';

export type NetworkType = 'Mainnet' | 'Testnet' | 'Devnet' | 'NFTDevnet' | null;

// タイムアウト付きPromiseラッパー
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

const CONNECTION_TIMEOUT = 60000; // 60秒（ユーザーが承認する時間を考慮）

export type GemWalletState = {
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  publicKey: string | null;
  network: NetworkType;
  error: string | null;
};

export type SendPaymentParams = {
  destination: string;
  amount: string; // XRPの場合はdrops、トークンの場合は通貨単位の文字列
  currency?: string; // 'XRP' または 'RLUSD' など
  issuer?: string; // トークンの発行者アドレス（XRPの場合は不要）
  memos?: Array<{
    memoType?: string;
    memoData?: string;
  }>;
};

export type SendPaymentResult = {
  success: boolean;
  hash?: string;
  error?: string;
};

export type UseGemWalletReturn = GemWalletState & {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  refreshNetwork: () => Promise<void>;
  sendPayment: (params: SendPaymentParams) => Promise<SendPaymentResult>;
};

const STORAGE_KEY = 'gem-wallet-connected';

/**
 * Gem Wallet接続用カスタムフック
 */
export function useGemWallet(): UseGemWalletReturn {
  console.log('[useGemWallet] Hook initialized');
  const t = useTranslations('gemwallet.hook');

  const [state, setState] = useState<GemWalletState>({
    isInstalled: false,
    isConnected: false,
    isConnecting: false,
    address: null,
    publicKey: null,
    network: null,
    error: null,
  });

  console.log('[useGemWallet] Current state:', state);

  // Gem Walletがインストールされているか確認
  const checkInstalled = useCallback(async (): Promise<boolean> => {
    console.log('[useGemWallet] checkInstalled: Starting...');
    try {
      console.log('[useGemWallet] checkInstalled: Calling isInstalled()...');
      const response = await isInstalled();
      console.log('[useGemWallet] checkInstalled: Response:', response);
      const installed = response.result.isInstalled;
      console.log('[useGemWallet] checkInstalled: isInstalled =', installed);
      setState((prev) => ({ ...prev, isInstalled: installed }));
      return installed;
    } catch (error) {
      console.error('[useGemWallet] checkInstalled: Error:', error);
      setState((prev) => ({ ...prev, isInstalled: false }));
      return false;
    }
  }, []);

  // ネットワーク情報を取得
  const refreshNetwork = useCallback(async (): Promise<void> => {
    console.log('[useGemWallet] refreshNetwork: Starting...');
    try {
      console.log('[useGemWallet] refreshNetwork: Calling getNetwork()...');
      const response = await withTimeout(
        getNetwork(),
        10000, // 10秒
        t('timeout', { operation: t('operations.getNetwork'), seconds: 10 })
      );
      console.log('[useGemWallet] refreshNetwork: Response:', response);
      const networkResult = response.result;
      if (networkResult?.network) {
        console.log('[useGemWallet] refreshNetwork: Network =', networkResult.network);
        setState((prev) => ({
          ...prev,
          network: networkResult.network as NetworkType,
        }));
      } else {
        console.log('[useGemWallet] refreshNetwork: No network in result');
      }
    } catch (error) {
      console.error('[useGemWallet] refreshNetwork: Error:', error);
    }
  }, [t]);

  // ウォレットに接続
  const connect = useCallback(async (): Promise<boolean> => {
    console.log('[useGemWallet] connect: Starting...');
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // インストール確認
      console.log('[useGemWallet] connect: Checking if installed...');
      const installed = await checkInstalled();
      console.log('[useGemWallet] connect: Installed =', installed);
      if (!installed) {
        console.log('[useGemWallet] connect: Not installed, returning false');
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: t('notInstalledError'),
        }));
        return false;
      }

      // アドレス取得（ユーザーに接続許可を求める）
      console.log('[useGemWallet] connect: Calling getAddress()...');
      console.log('[useGemWallet] connect: ⚠️ GemWalletのポップアップが表示されるはずです。表示されない場合は、ブラウザのポップアップブロッカーを確認してください。');
      console.log('[useGemWallet] connect: ⚠️ GemWalletがロックされている場合は、まずウォレットをアンロックしてください。');

      let addressResponse;
      try {
        addressResponse = await withTimeout(
          getAddress(),
          CONNECTION_TIMEOUT,
          t('timeout', { operation: t('operations.getAddress'), seconds: CONNECTION_TIMEOUT / 1000 })
        );
      } catch (timeoutError) {
        console.error('[useGemWallet] connect: getAddress() timeout or error:', timeoutError);
        const errorMessage = timeoutError instanceof Error ? timeoutError.message : t('getAddressFailed');
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
        return false;
      }

      console.log('[useGemWallet] connect: Address response:', addressResponse);
      if (!addressResponse.result?.address) {
        console.log('[useGemWallet] connect: No address in response, connection cancelled');
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: t('connectionCancelled'),
        }));
        return false;
      }

      // 公開鍵取得（タイムアウト付き）
      console.log('[useGemWallet] connect: Calling getPublicKey()...');
      let publicKey: string | null = null;
      try {
        const publicKeyResponse = await withTimeout(
          getPublicKey(),
          10000, // 10秒
          t('timeout', { operation: t('operations.getPublicKey'), seconds: 10 })
        );
        console.log('[useGemWallet] connect: PublicKey response:', publicKeyResponse);
        publicKey = publicKeyResponse.result?.publicKey ?? null;
        console.log('[useGemWallet] connect: PublicKey =', publicKey);
      } catch (error) {
        console.warn('[useGemWallet] connect: getPublicKey() failed (non-critical):', error);
        // 公開鍵取得は必須ではないため、エラーでも続行
      }

      // ネットワーク取得（タイムアウト付き）
      console.log('[useGemWallet] connect: Calling getNetwork()...');
      let network: NetworkType = null;
      try {
        const networkResponse = await withTimeout(
          getNetwork(),
          10000, // 10秒
          t('timeout', { operation: t('operations.getNetwork'), seconds: 10 })
        );
        console.log('[useGemWallet] connect: Network response:', networkResponse);
        network = (networkResponse.result?.network as NetworkType) ?? null;
        console.log('[useGemWallet] connect: Network =', network);
      } catch (error) {
        console.warn('[useGemWallet] connect: getNetwork() failed (non-critical):', error);
        // ネットワーク取得は必須ではないため、エラーでも続行
      }

      const newState = {
        isInstalled: true,
        isConnected: true,
        isConnecting: false,
        address: addressResponse.result.address,
        publicKey,
        network,
        error: null,
      };
      console.log('[useGemWallet] connect: Setting new state:', newState);
      setState(newState);

      // 接続状態を保存
      if (typeof window !== 'undefined') {
        console.log('[useGemWallet] connect: Saving to localStorage');
        localStorage.setItem(STORAGE_KEY, 'true');
      }

      console.log('[useGemWallet] connect: Success!');
      return true;
    } catch (error) {
      console.error('[useGemWallet] connect: Error:', error);
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else {
        message = t('connectionFailed');
      }
      console.log('[useGemWallet] connect: Error message:', message);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
      return false;
    }
  }, [checkInstalled, t]);

  // 切断
  const disconnect = useCallback((): void => {
    console.log('[useGemWallet] disconnect: Starting...');
    setState({
      isInstalled: state.isInstalled,
      isConnected: false,
      isConnecting: false,
      address: null,
      publicKey: null,
      network: null,
      error: null,
    });

    if (typeof window !== 'undefined') {
      console.log('[useGemWallet] disconnect: Removing from localStorage');
      localStorage.removeItem(STORAGE_KEY);
    }
    console.log('[useGemWallet] disconnect: Done');
  }, [state.isInstalled]);

  // 初期化時にインストール確認のみ（自動再接続はしない）
  // 自動再接続はgetAddress()がユーザー操作を必要とするため、
  // ユーザーが明示的に接続ボタンをクリックした時のみ接続を試みる
  useEffect(() => {
    console.log('[useGemWallet] useEffect: Initializing...');
    const init = async (): Promise<void> => {
      console.log('[useGemWallet] init: Starting...');
      const installed = await checkInstalled();
      console.log('[useGemWallet] init: Installed =', installed);
      // 注: 自動再接続は削除。getAddress()はユーザー操作が必要なため、
      // ページロード時に自動実行するとタイムアウトエラーが発生する可能性がある
    };

    init();
  }, [checkInstalled]);

  // 支払いを実行
  const sendPayment = useCallback(async (params: SendPaymentParams): Promise<SendPaymentResult> => {
    console.log('[useGemWallet] sendPayment: Starting with params:', params);

    if (!state.isConnected) {
      console.log('[useGemWallet] sendPayment: Not connected');
      return { success: false, error: t('notConnected') };
    }

    try {
      // GemWallet用のメモ形式に変換（hex エンコード）
      const memos = params.memos?.map((memo) => ({
        memo: {
          memoType: memo.memoType ? Buffer.from(memo.memoType, 'utf8').toString('hex').toUpperCase() : undefined,
          memoData: memo.memoData ? Buffer.from(memo.memoData, 'utf8').toString('hex').toUpperCase() : undefined,
        },
      }));

      // 金額の設定（XRPの場合はdrops、トークンの場合はIssuedCurrencyAmount）
      let amount: string | { currency: string; issuer: string; value: string };
      if (!params.currency || params.currency === 'XRP') {
        // XRPの場合: dropsで指定
        amount = params.amount;
      } else {
        // トークンの場合: IssuedCurrencyAmount形式
        if (!params.issuer) {
          console.log('[useGemWallet] sendPayment: Missing issuer for token payment');
          return { success: false, error: t('issuerRequired') };
        }
        amount = {
          currency: params.currency,
          issuer: params.issuer,
          value: params.amount,
        };
      }

      const paymentRequest: SendPaymentRequest = {
        destination: params.destination,
        amount,
        memos,
      };

      console.log('[useGemWallet] sendPayment: Calling gemSendPayment with:', paymentRequest);
      console.log('[useGemWallet] sendPayment: ⚠️ GemWalletのポップアップが表示されます。承認してください。');

      const response = await withTimeout(
        gemSendPayment(paymentRequest),
        CONNECTION_TIMEOUT * 2, // 支払いは長めのタイムアウト
        t('timeout', { operation: t('operations.payment'), seconds: (CONNECTION_TIMEOUT * 2) / 1000 })
      );

      console.log('[useGemWallet] sendPayment: Response:', response);

      if (response.result?.hash) {
        console.log('[useGemWallet] sendPayment: Success! Hash:', response.result.hash);
        return { success: true, hash: response.result.hash };
      } else {
        console.log('[useGemWallet] sendPayment: No hash in response, payment may have been rejected');
        return { success: false, error: t('paymentCancelledOrFailed') };
      }
    } catch (error) {
      console.error('[useGemWallet] sendPayment: Error:', error);
      const message = error instanceof Error ? error.message : t('paymentFailed');
      return { success: false, error: message };
    }
  }, [state.isConnected, t]);

  console.log('[useGemWallet] Returning state and functions');
  return {
    ...state,
    connect,
    disconnect,
    refreshNetwork,
    sendPayment,
  };
}
