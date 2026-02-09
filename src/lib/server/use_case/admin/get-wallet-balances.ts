import { getOrganizationWallets } from '@/lib/server/use_case/admin/get-organization-wallets';
import { getAccountBalance } from '@/lib/server/gateway/xrpl-gateway';
import { getXrpUsdRate } from '@/lib/server/gateway/exchange-rate-gateway';

export type WalletBalanceItem = {
  id: string;
  label: string | null;
  cryptoType: string;
  walletAddress: string;
  isDefault: boolean;
  balanceXrp: number;
  balanceUsd: number;
};

export type WalletBalanceSummaryItem = {
  cryptoType: string;
  totalBalance: number;
  totalBalanceUsd: number;
};

export type WalletBalancesResult = {
  wallets: WalletBalanceItem[];
  summary: WalletBalanceSummaryItem[];
  totalUsd: number;
  xrpUsdRate: number;
  rateUpdatedAt: Date;
  network: string;
};

/**
 * 組織の全ウォレット残高 + USD換算を取得
 */
export async function getWalletBalances(organizationId: string): Promise<WalletBalancesResult> {
  const [wallets, xrpUsdRate] = await Promise.all([
    getOrganizationWallets(organizationId),
    getXrpUsdRate(),
  ]);

  const rateUpdatedAt = new Date();

  // 各ウォレットの残高を並列取得
  const balanceResults = await Promise.all(
    wallets.map(async (wallet) => {
      const balance = await getAccountBalance(wallet.walletAddress);
      const balanceUsd = xrpUsdRate > 0 ? balance.xrp * xrpUsdRate : 0;

      return {
        id: wallet.id,
        label: wallet.label,
        cryptoType: wallet.cryptoType,
        walletAddress: wallet.walletAddress,
        isDefault: wallet.isDefault,
        balanceXrp: balance.xrp,
        balanceUsd,
      };
    }),
  );

  // 暗号資産ごとの合計を計算
  const summaryMap = new Map<string, { totalBalance: number; totalBalanceUsd: number }>();

  for (const wallet of balanceResults) {
    const existing = summaryMap.get(wallet.cryptoType) ?? { totalBalance: 0, totalBalanceUsd: 0 };
    existing.totalBalance += wallet.balanceXrp;
    existing.totalBalanceUsd += wallet.balanceUsd;
    summaryMap.set(wallet.cryptoType, existing);
  }

  const summary: WalletBalanceSummaryItem[] = Array.from(summaryMap.entries()).map(
    ([cryptoType, totals]) => ({
      cryptoType,
      totalBalance: totals.totalBalance,
      totalBalanceUsd: totals.totalBalanceUsd,
    }),
  );

  const totalUsd = summary.reduce((sum, s) => sum + s.totalBalanceUsd, 0);

  const network = process.env.XRPL_NETWORK ?? 'testnet';

  return {
    wallets: balanceResults,
    summary,
    totalUsd,
    xrpUsdRate,
    rateUpdatedAt,
    network,
  };
}
