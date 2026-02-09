'use server';

import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getWalletBalances } from '@/lib/server/use_case/admin/get-wallet-balances';

export type WalletBalanceItemData = {
  id: string;
  label: string | null;
  cryptoType: string;
  walletAddress: string;
  isDefault: boolean;
  balanceXrp: number;
  balanceUsd: number;
};

export type WalletBalanceSummaryData = {
  cryptoType: string;
  totalBalance: number;
  totalBalanceUsd: number;
};

export type WalletBalancesData = {
  wallets: WalletBalanceItemData[];
  summary: WalletBalanceSummaryData[];
  totalUsd: number;
  xrpUsdRate: number;
  rateUpdatedAt: string;
  network: string;
};

export type GetWalletBalancesResult = {
  success: boolean;
  error?: string;
  data?: WalletBalancesData;
};

/**
 * 組織ウォレット残高一覧を取得
 */
export async function getWalletBalancesAction(): Promise<GetWalletBalancesResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const result = await getWalletBalances(session.user.organizationId);

    return {
      success: true,
      data: {
        wallets: result.wallets,
        summary: result.summary,
        totalUsd: result.totalUsd,
        xrpUsdRate: result.xrpUsdRate,
        rateUpdatedAt: result.rateUpdatedAt.toISOString(),
        network: result.network,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Get wallet balances error:', error);
    return { success: false, error: 'ウォレット残高の取得に失敗しました' };
  }
}
