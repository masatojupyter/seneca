import { prisma } from '@/lib/server/infra/prisma';

type DeleteOrganizationWalletInput = {
  id: string;
  organizationId: string;
};

/**
 * 組織ウォレットを削除（デフォルトウォレットは削除不可）
 */
export async function deleteOrganizationWallet(input: DeleteOrganizationWalletInput): Promise<void> {
  const { id, organizationId } = input;

  const wallet = await prisma.organizationWallet.findFirst({
    where: { id, organizationId },
  });

  if (!wallet) {
    throw new Error('ウォレットが見つかりません');
  }

  if (wallet.isDefault) {
    throw new Error('デフォルトウォレットは削除できません。先に別のウォレットをデフォルトに設定してください');
  }

  await prisma.organizationWallet.delete({
    where: { id },
  });
}
