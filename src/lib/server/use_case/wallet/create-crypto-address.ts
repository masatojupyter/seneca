import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/server/infra/prisma';
import type { CryptoType } from '@/lib/shared/entity';

type CreateCryptoAddressInput = {
  workerId: string;
  cryptoType: CryptoType;
  address: string;
  label?: string;
  isDefault?: boolean;
};

type CryptoAddress = {
  id: string;
  workerId: string;
  cryptoType: string;
  address: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
};

/**
 * XRPLアドレスのバリデーション（XRPとRLUSD共通）
 * RLUSDもXRP Ledger上のトークンなので、同じアドレス形式を使用
 */
function validateXrplAddress(address: string): boolean {
  // XRPLアドレスは "r" で始まり、25-35文字
  const xrplRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  return xrplRegex.test(address);
}

/**
 * 暗号資産アドレスを作成
 */
export async function createCryptoAddress(
  input: CreateCryptoAddressInput
): Promise<CryptoAddress> {
  const t = await getTranslations('usecase.wallet');
  const { workerId, cryptoType, address, label, isDefault = false } = input;

  // アドレスのバリデーション（XRPとRLUSDは同じXRPLアドレス形式）
  if ((cryptoType === 'XRP' || cryptoType === 'RLUSD') && !validateXrplAddress(address)) {
    throw new Error(t('invalidXrplAddress'));
  }

  // 同じアドレスが既に登録されていないか確認
  const existing = await prisma.cryptoAddress.findFirst({
    where: {
      workerId,
      address,
    },
  });

  if (existing) {
    throw new Error(t('addressAlreadyRegistered'));
  }

  // デフォルトに設定する場合、既存のデフォルトを解除
  if (isDefault) {
    await prisma.cryptoAddress.updateMany({
      where: {
        workerId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  // アドレスを作成
  const cryptoAddress = await prisma.cryptoAddress.create({
    data: {
      workerId,
      cryptoType,
      address,
      label,
      isDefault,
      isActive: true,
    },
  });

  return cryptoAddress;
}
