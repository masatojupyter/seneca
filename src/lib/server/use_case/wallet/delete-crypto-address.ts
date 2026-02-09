import { prisma } from '@/lib/server/infra/prisma';

type DeleteCryptoAddressInput = {
  id: string;
  workerId: string;
};

/**
 * 暗号資産アドレスを削除
 */
export async function deleteCryptoAddress(
  input: DeleteCryptoAddressInput
): Promise<void> {
  const { id, workerId } = input;

  // アドレスの存在確認
  const existing = await prisma.cryptoAddress.findUnique({
    where: { id },
  });

  if (!existing || existing.workerId !== workerId) {
    throw new Error('アドレスが見つかりません');
  }

  // デフォルトアドレスの場合は削除不可
  if (existing.isDefault) {
    throw new Error('デフォルトアドレスは削除できません。先に別のアドレスをデフォルトに設定してください');
  }

  // アドレスを削除
  await prisma.cryptoAddress.delete({
    where: { id },
  });
}
