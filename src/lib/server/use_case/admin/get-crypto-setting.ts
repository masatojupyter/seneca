import { prisma } from '@/lib/server/infra/prisma';

export type CryptoSettingDetail = {
  id: string;
  autoPaymentEnabled: boolean;
  maxAutoPaymentUsd: number;
  dailyPaymentLimit: number;
  dailyAmountLimitUsd: number | null;
  newAddressLockHours: number;
  require2FA: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 組織の暗号資産設定を取得（支払い・セキュリティポリシーのみ）
 */
export async function getCryptoSetting(organizationId: string): Promise<CryptoSettingDetail | null> {
  const setting = await prisma.cryptoSetting.findUnique({
    where: { organizationId },
  });

  if (!setting) {
    return null;
  }

  return {
    id: setting.id,
    autoPaymentEnabled: setting.autoPaymentEnabled,
    maxAutoPaymentUsd: Number(setting.maxAutoPaymentUsd),
    dailyPaymentLimit: setting.dailyPaymentLimit,
    dailyAmountLimitUsd: setting.dailyAmountLimitUsd ? Number(setting.dailyAmountLimitUsd) : null,
    newAddressLockHours: setting.newAddressLockHours,
    require2FA: setting.require2FA,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}
