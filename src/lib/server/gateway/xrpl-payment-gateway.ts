import { Wallet, xrpToDrops, convertStringToHex } from 'xrpl';
import type { Payment } from 'xrpl';
import { withXrplClient } from '@/lib/server/infra/xrpl-client';
import {
  PaymentError,
  InvalidDestinationError,
} from '@/lib/server/errors';

type MemoEntry = {
  memoType: string;
  memoData: string;
};

type SendPaymentInput = {
  fromSecret: string;
  toAddress: string;
  amountDrops: string;
  memos?: MemoEntry[];
};

type SendPaymentResult = {
  transactionHash: string;
  ledgerIndex: number;
  fee: string;
  deliveredAmount: string;
};

type TransactionStatus = 'validated' | 'failed' | 'pending';

/**
 * 送金先アドレスがXRPL上でfunded済みか検証
 */
export async function validateDestinationAddress(address: string): Promise<void> {
  try {
    await withXrplClient(async (client) => {
      await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('actNotFound')) {
      throw new InvalidDestinationError(address);
    }
    throw new PaymentError(
      `送金先アドレスの検証に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    );
  }
}

/**
 * XRP送金を実行
 * fromSecretからWalletを復元し、Paymentトランザクションを構築・署名・送信
 */
export async function sendPayment(input: SendPaymentInput): Promise<SendPaymentResult> {
  const { fromSecret, toAddress, amountDrops, memos } = input;

  const wallet = Wallet.fromSeed(fromSecret);

  const txMemos = memos?.map((m) => ({
    Memo: {
      MemoType: convertStringToHex(m.memoType),
      MemoData: convertStringToHex(m.memoData),
    },
  }));

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: wallet.classicAddress,
    Destination: toAddress,
    Amount: amountDrops,
    ...(txMemos && txMemos.length > 0 ? { Memos: txMemos } : {}),
  };

  return await withXrplClient(async (client) => {
    const result = await client.submitAndWait(payment, {
      autofill: true,
      wallet,
    });

    const meta = result.result.meta;
    if (typeof meta === 'object' && meta !== null && 'TransactionResult' in meta) {
      const txResult = meta.TransactionResult as string;
      if (txResult !== 'tesSUCCESS') {
        throw new PaymentError(
          `XRP送金が失敗しました: ${txResult}`,
          txResult
        );
      }
    }

    const deliveredAmount =
      typeof meta === 'object' &&
      meta !== null &&
      'delivered_amount' in meta &&
      typeof meta.delivered_amount === 'string'
        ? meta.delivered_amount
        : amountDrops;

    const txJson = result.result.tx_json;
    const fee = txJson && 'Fee' in txJson ? String(txJson.Fee) : '12';

    return {
      transactionHash: result.result.hash,
      ledgerIndex: result.result.ledger_index ?? 0,
      fee,
      deliveredAmount,
    };
  });
}

/**
 * トランザクションの検証状態を取得
 */
export async function getTransactionStatus(txHash: string): Promise<TransactionStatus> {
  try {
    return await withXrplClient(async (client) => {
      const result = await client.request({
        command: 'tx',
        transaction: txHash,
      });

      if (!result.result.validated) {
        return 'pending';
      }

      const meta = result.result.meta;
      if (typeof meta === 'object' && meta !== null && 'TransactionResult' in meta) {
        const txResult = meta.TransactionResult as string;
        return txResult === 'tesSUCCESS' ? 'validated' : 'failed';
      }

      return 'pending';
    });
  } catch {
    return 'pending';
  }
}

/**
 * XRP額をdrops文字列に変換するヘルパー
 */
export function convertXrpToDrops(xrpAmount: number): string {
  const truncated = Math.floor(xrpAmount * 1_000_000) / 1_000_000;
  return xrpToDrops(truncated);
}
