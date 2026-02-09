import { withXrplClient } from '@/lib/server/infra/xrpl-client';
import { NoTrustlineError, TrustlineLimitError, PaymentError } from '@/lib/server/errors';
import type { CryptoType } from '@/lib/shared/entity';

type TrustlineStatus = {
  exists: boolean;
  limit: string;
  balance: string;
};

type AccountLinesResponse = {
  result: {
    lines?: Array<{
      currency: string;
      account: string;
      balance: string;
      limit: string;
      limit_peer: string;
    }>;
  };
};

/**
 * 指定アドレスのトラストラインを確認
 */
export async function checkTrustline(
  address: string,
  currency: string,
  issuer: string
): Promise<TrustlineStatus> {
  return await withXrplClient(async (client) => {
    const response = (await client.request({
      command: 'account_lines',
      account: address,
      peer: issuer,
    })) as AccountLinesResponse;

    const trustline = response.result.lines?.find(
      (line) => line.currency === currency && line.account === issuer
    );

    if (!trustline) {
      return { exists: false, limit: '0', balance: '0' };
    }

    return {
      exists: true,
      limit: trustline.limit,
      balance: trustline.balance,
    };
  });
}

/**
 * RLUSDトラストラインが有効か検証
 * 存在しない場合はNoTrustlineErrorを投げる
 * 上限が不足している場合はTrustlineLimitErrorを投げる
 */
export async function validateRlusdTrustline(
  address: string,
  issuerAddress: string,
  currencyCode: string,
  requiredAmount?: number
): Promise<void> {
  try {
    const status = await checkTrustline(address, currencyCode, issuerAddress);

    if (!status.exists) {
      throw new NoTrustlineError(address, 'RLUSD');
    }

    const limit = parseFloat(status.limit);
    if (limit <= 0) {
      throw new TrustlineLimitError(address, 'RLUSD');
    }

    if (requiredAmount !== undefined) {
      const balance = parseFloat(status.balance);
      const availableLimit = limit - balance;
      if (availableLimit < requiredAmount) {
        throw new TrustlineLimitError(address, 'RLUSD');
      }
    }
  } catch (error: unknown) {
    if (error instanceof NoTrustlineError || error instanceof TrustlineLimitError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes('actNotFound')) {
      throw new NoTrustlineError(address, 'RLUSD');
    }
    throw new PaymentError(
      `トラストラインの検証に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    );
  }
}

/**
 * 指定通貨タイプに対してトラストライン検証が必要かどうか
 */
export function requiresTrustlineValidation(cryptoType: CryptoType): boolean {
  return cryptoType === 'RLUSD';
}

/**
 * トークン残高を取得
 */
export async function getTokenBalance(
  address: string,
  currency: string,
  issuer: string
): Promise<number> {
  const status = await checkTrustline(address, currency, issuer);
  return status.exists ? parseFloat(status.balance) : 0;
}
