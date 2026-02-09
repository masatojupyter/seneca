import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';
import { sendPayment, convertXrpToDrops } from '@/lib/server/gateway/xrpl-payment-gateway';
import { sendRlusdPayment, getRlusdBalance } from '@/lib/server/gateway/rlusd-payment-gateway';
import { withXrplClient } from '@/lib/server/infra/xrpl-client';
import { PaymentError } from '@/lib/server/errors';

type MemoEntry = {
  memoType: string;
  memoData: string;
};

type SendCryptoPaymentInput = {
  cryptoType: CryptoType;
  fromSecret: string;
  toAddress: string;
  amount: number;
  tokenIssuerConfig?: TokenIssuerConfig;
  memos?: MemoEntry[];
};

type SendPaymentResult = {
  transactionHash: string;
  ledgerIndex: number;
  fee: string;
  deliveredAmount: string;
};

/**
 * 通貨タイプに応じて適切な送金処理を実行
 */
export async function sendCryptoPayment(
  input: SendCryptoPaymentInput
): Promise<SendPaymentResult> {
  const { cryptoType, fromSecret, toAddress, amount, tokenIssuerConfig, memos } = input;

  switch (cryptoType) {
    case 'XRP': {
      const amountDrops = convertXrpToDrops(amount);
      return await sendPayment({
        fromSecret,
        toAddress,
        amountDrops,
        memos,
      });
    }
    case 'RLUSD': {
      if (!tokenIssuerConfig) {
        throw new PaymentError('RLUSD送金にはトークン発行者設定が必要です');
      }
      return await sendRlusdPayment({
        fromSecret,
        toAddress,
        amount,
        issuerAddress: tokenIssuerConfig.issuerAddress,
        currencyCode: tokenIssuerConfig.currencyCode,
        memos,
      });
    }
    default:
      throw new PaymentError(`サポートされていない通貨タイプです: ${cryptoType}`);
  }
}

type WalletBalance = {
  xrp: number;
  rlusd: number;
};

/**
 * ウォレットの残高を取得（XRPとRLUSD両方）
 */
export async function getWalletBalances(
  address: string,
  tokenIssuerConfig?: TokenIssuerConfig
): Promise<WalletBalance> {
  const xrpBalance = await withXrplClient(async (client) => {
    try {
      const response = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });
      // Balance is in drops (1 XRP = 1,000,000 drops)
      const balanceDrops = Number(response.result.account_data.Balance);
      return balanceDrops / 1_000_000;
    } catch {
      return 0;
    }
  });

  let rlusdBalance = 0;
  if (tokenIssuerConfig) {
    rlusdBalance = await getRlusdBalance(
      address,
      tokenIssuerConfig.issuerAddress,
      tokenIssuerConfig.currencyCode
    );
  }

  return { xrp: xrpBalance, rlusd: rlusdBalance };
}

/**
 * 通貨タイプに応じた残高を取得
 */
export async function getCryptoBalance(
  address: string,
  cryptoType: CryptoType,
  tokenIssuerConfig?: TokenIssuerConfig
): Promise<number> {
  const balances = await getWalletBalances(address, tokenIssuerConfig);
  return cryptoType === 'XRP' ? balances.xrp : balances.rlusd;
}
