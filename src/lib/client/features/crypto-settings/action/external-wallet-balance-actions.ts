'use server';

import { z } from 'zod';
import { getWalletBalances } from '@/lib/server/gateway/crypto-payment-gateway';
import { getTokenIssuerConfig } from '@/lib/server/infra/token-issuer-config';

const getBalanceSchema = z.object({
  address: z.string().min(1, 'アドレスは必須です'),
});

export type ExternalWalletBalanceResult = {
  success: boolean;
  error?: string;
  xrp?: number;
  rlusd?: number;
  rlusdConfigured?: boolean;
};

/**
 * 外部ウォレット（Gem Walletなど）の残高を取得
 * 認証不要（XRPL上の公開情報）
 */
export async function getExternalWalletBalanceAction(
  address: string
): Promise<ExternalWalletBalanceResult> {
  console.log('[getExternalWalletBalanceAction] Starting with address:', address);
  try {
    console.log('[getExternalWalletBalanceAction] Validating address...');
    const validated = getBalanceSchema.parse({ address });
    console.log('[getExternalWalletBalanceAction] Validated address:', validated.address);

    // RLUSD設定を取得
    console.log('[getExternalWalletBalanceAction] Getting token issuer config...');
    const tokenIssuerConfig = await getTokenIssuerConfig('RLUSD');
    console.log('[getExternalWalletBalanceAction] Token issuer config:', tokenIssuerConfig);

    // 残高を取得
    console.log('[getExternalWalletBalanceAction] Getting wallet balances...');
    const balances = await getWalletBalances(validated.address, tokenIssuerConfig);
    console.log('[getExternalWalletBalanceAction] Balances:', balances);

    const result = {
      success: true,
      xrp: balances.xrp,
      rlusd: balances.rlusd,
      rlusdConfigured: !!tokenIssuerConfig,
    };
    console.log('[getExternalWalletBalanceAction] Returning result:', result);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[getExternalWalletBalanceAction] Zod validation error:', error.errors);
      return { success: false, error: error.errors[0].message };
    }
    console.error('[getExternalWalletBalanceAction] Error:', error);
    return { success: false, error: '残高の取得に失敗しました' };
  }
}
