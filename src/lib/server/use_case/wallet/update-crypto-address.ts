import { prisma } from '@/lib/server/infra/prisma';

type UpdateCryptoAddressInput = {
  id: string;
  workerId: string;
  label?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

type CryptoAddress = {
  id: string;
  workerId: string;
  cryptoType: string;
  address: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  updatedAt: Date;
};

/**
 * 暗号資産アドレスを更新
 */
export async function updateCryptoAddress(
  input: UpdateCryptoAddressInput
): Promise<CryptoAddress> {
  const { id, workerId, label, isDefault, isActive } = input;

  // アドレスの存在確認
  const existing = await prisma.cryptoAddress.findUnique({
    where: { id },
  });

  if (!existing || existing.workerId !== workerId) {
    throw new Error('アドレスが見つかりません');
  }

  // デフォルトに設定する場合、既存のデフォルトを解除
  if (isDefault === true) {
    await prisma.cryptoAddress.updateMany({
      where: {
        workerId,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });
  }

  // アドレスを更新
  const updated = await prisma.cryptoAddress.update({
    where: { id },
    data: {
      label: label !== undefined ? label : undefined,
      isDefault: isDefault !== undefined ? isDefault : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
    },
  });

  return updated;
}
