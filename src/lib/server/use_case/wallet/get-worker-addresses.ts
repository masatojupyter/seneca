import { prisma } from '@/lib/server/infra/prisma';

type CryptoAddress = {
  id: string;
  workerId: string;
  cryptoType: string;
  address: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 従業員の暗号資産アドレス一覧を取得
 */
export async function getWorkerAddresses(workerId: string): Promise<CryptoAddress[]> {
  const addresses = await prisma.cryptoAddress.findMany({
    where: { workerId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return addresses;
}
