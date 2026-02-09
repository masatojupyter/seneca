import { prisma } from '@/lib/server/infra/prisma';

export type OrganizationWalletItem = {
  id: string;
  organizationId: string;
  cryptoType: string;
  walletAddress: string;
  label: string | null;
  requiresManualSigning: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 組織のウォレット一覧を取得（secretは返さない）
 */
export async function getOrganizationWallets(organizationId: string): Promise<OrganizationWalletItem[]> {
  const wallets = await prisma.organizationWallet.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return wallets.map((wallet) => ({
    id: wallet.id,
    organizationId: wallet.organizationId,
    cryptoType: wallet.cryptoType,
    walletAddress: wallet.walletAddress,
    label: wallet.label,
    requiresManualSigning: wallet.requiresManualSigning,
    isDefault: wallet.isDefault,
    isActive: wallet.isActive,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  }));
}
