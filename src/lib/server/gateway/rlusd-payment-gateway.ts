import { Wallet, convertStringToHex } from 'xrpl';
import type { Payment, IssuedCurrencyAmount } from 'xrpl';
import { withXrplClient } from '@/lib/server/infra/xrpl-client';
import { PaymentError } from '@/lib/server/errors';
import { validateRlusdTrustline } from '@/lib/server/gateway/trustline-gateway';

/**
 * 通貨コードを正規化（16進数形式とASCII形式の両方に対応）
 * XRPLでは3文字より長い通貨コードは40桁の16進数形式で返される
 */
function normalizeCurrencyCode(code: string): string {
  // 既に3文字以下ならそのまま返す
  if (code.length <= 3) {
    return code.toUpperCase();
  }

  // 40文字の16進数形式なら、ASCII文字列に変換
  if (code.length === 40 && /^[0-9A-Fa-f]+$/.test(code)) {
    let result = '';
    for (let i = 0; i < code.length; i += 2) {
      const byte = parseInt(code.substring(i, i + 2), 16);
      if (byte === 0) break; // null文字で終了
      result += String.fromCharCode(byte);
    }
    return result.toUpperCase();
  }

  // それ以外はそのまま返す
  return code.toUpperCase();
}

type MemoEntry = {
  memoType: string;
  memoData: string;
};

type SendRlusdPaymentInput = {
  fromSecret: string;
  toAddress: string;
  amount: number;
  issuerAddress: string;
  currencyCode: string;
  memos?: MemoEntry[];
};

type SendPaymentResult = {
  transactionHash: string;
  ledgerIndex: number;
  fee: string;
  deliveredAmount: string;
};

/**
 * RLUSD送金を実行
 * トークン送金のため、Amount はオブジェクト形式で指定
 */
export async function sendRlusdPayment(
  input: SendRlusdPaymentInput
): Promise<SendPaymentResult> {
  const { fromSecret, toAddress, amount, issuerAddress, currencyCode, memos } = input;

  // 送金前にトラストライン検証
  await validateRlusdTrustline(toAddress, issuerAddress, currencyCode, amount);

  const wallet = Wallet.fromSeed(fromSecret);

  const txMemos = memos?.map((m) => ({
    Memo: {
      MemoType: convertStringToHex(m.memoType),
      MemoData: convertStringToHex(m.memoData),
    },
  }));

  // RLUSD金額をオブジェクト形式で指定
  const rlusdAmount: IssuedCurrencyAmount = {
    currency: currencyCode,
    issuer: issuerAddress,
    value: amount.toFixed(6),
  };

  const payment: Payment = {
    TransactionType: 'Payment',
    Account: wallet.classicAddress,
    Destination: toAddress,
    Amount: rlusdAmount,
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
        throw new PaymentError(`RLUSD送金が失敗しました: ${txResult}`, txResult);
      }
    }

    // delivered_amount の取得（トークンの場合はオブジェクト）
    let deliveredAmount = amount.toFixed(6);
    if (
      typeof meta === 'object' &&
      meta !== null &&
      'delivered_amount' in meta
    ) {
      const delivered = meta.delivered_amount;
      if (typeof delivered === 'object' && delivered !== null && 'value' in delivered) {
        deliveredAmount = (delivered as IssuedCurrencyAmount).value;
      }
    }

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
 * 組織ウォレットのRLUSD残高を取得
 */
export async function getRlusdBalance(
  address: string,
  issuerAddress: string,
  currencyCode: string
): Promise<number> {
  return await withXrplClient(async (client) => {
    try {
      const response = await client.request({
        command: 'account_lines',
        account: address,
        peer: issuerAddress,
      });

      const lines = response.result.lines as Array<{
        currency: string;
        balance: string;
      }> | undefined;

      // 通貨コードを正規化して比較（XRPLは16進数形式で返すことがある）
      const normalizedTarget = normalizeCurrencyCode(currencyCode);
      const trustline = lines?.find(
        (line) => normalizeCurrencyCode(line.currency) === normalizedTarget
      );
      return trustline ? parseFloat(trustline.balance) : 0;
    } catch (error) {
      console.error('[getRlusdBalance] Error fetching balance:', error);
      return 0;
    }
  });
}
