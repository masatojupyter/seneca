import { prisma } from '@/lib/server/infra/prisma';

type UpdateCryptoSettingInput = {
  organizationId: string;
  autoPaymentEnabled: boolean;
  maxAutoPaymentUsd: number;
  dailyPaymentLimit: number;
  dailyAmountLimitUsd: number | null;
  newAddressLockHours: number;
  require2FA: boolean;
};

/**
 * 暗号資産設定（支払い・セキュリティポリシー）を作成または更新
 */
export async function updateCryptoSetting(input: UpdateCryptoSettingInput): Promise<void> {
  const data = {
    autoPaymentEnabled: input.autoPaymentEnabled,
    maxAutoPaymentUsd: input.maxAutoPaymentUsd,
    dailyPaymentLimit: input.dailyPaymentLimit,
    dailyAmountLimitUsd: input.dailyAmountLimitUsd,
    newAddressLockHours: input.newAddressLockHours,
    require2FA: input.require2FA,
  };

  await prisma.cryptoSetting.upsert({
    where: { organizationId: input.organizationId },
    update: data,
    create: {
      organizationId: input.organizationId,
      ...data,
    },
  });
}
