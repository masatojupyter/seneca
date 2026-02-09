import { prisma } from '@/lib/server/infra/prisma';
import { encrypt } from '@/lib/server/infra/encryption';

type CreateOrganizationWalletInput = {
  organizationId: string;
  cryptoType: 'XRP';
  walletAddress: string;
  walletSecret: string;
  label?: string;
  isDefault?: boolean;
};

type CreatedWallet = {
  id: string;
  organizationId: string;
  cryptoType: string;
  walletAddress: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
};

const XRP_ADDRESS_REGEX = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

/**
 * 組織ウォレットを作成
 */
export async function createOrganizationWallet(input: CreateOrganizationWalletInput): Promise<CreatedWallet> {
  const { organizationId, cryptoType, walletAddress, walletSecret, label, isDefault = false } = input;

  // XRPアドレスのバリデーション
  if (cryptoType === 'XRP' && !XRP_ADDRESS_REGEX.test(walletAddress)) {
    throw new Error('無効なXRPアドレスです');
  }

  // 同じアドレスが既に登録されていないか確認
  const existing = await prisma.organizationWallet.findFirst({
    where: { organizationId, walletAddress },
  });

  if (existing) {
    throw new Error('このアドレスは既に登録されています');
  }

  // 既存のウォレット数を確認（最初のウォレットは自動的にデフォルト）
  const walletCount = await prisma.organizationWallet.count({
    where: { organizationId },
  });
  const shouldBeDefault = walletCount === 0 || isDefault;

  // デフォルトに設定する場合、既存のデフォルトを解除
  if (shouldBeDefault) {
    await prisma.organizationWallet.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // ウォレットを作成（シークレットはAES-256で暗号化）
  const wallet = await prisma.organizationWallet.create({
    data: {
      organizationId,
      cryptoType,
      walletAddress,
      walletSecretEnc: encrypt(walletSecret),
      label,
      isDefault: shouldBeDefault,
      isActive: true,
    },
  });

  return wallet;
}
