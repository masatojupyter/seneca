'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getCryptoSetting } from '@/lib/server/use_case/admin/get-crypto-setting';
import { updateCryptoSetting } from '@/lib/server/use_case/admin/update-crypto-setting';

export type CryptoSettingData = {
  id: string;
  autoPaymentEnabled: boolean;
  maxAutoPaymentUsd: number;
  dailyPaymentLimit: number;
  dailyAmountLimitUsd: number | null;
  newAddressLockHours: number;
  require2FA: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetCryptoSettingResult = {
  success: boolean;
  error?: string;
  data?: CryptoSettingData | null;
};

export type UpdateCryptoSettingResult = {
  success: boolean;
  error?: string;
};

const updateCryptoSettingSchema = z.object({
  autoPaymentEnabled: z.boolean(),
  maxAutoPaymentUsd: z.number().min(0, '0以上の値を入力してください'),
  dailyPaymentLimit: z.number().int().min(1, '1以上の整数を入力してください'),
  dailyAmountLimitUsd: z.number().min(0).nullable(),
  newAddressLockHours: z.number().int().min(0, '0以上の整数を入力してください'),
  require2FA: z.boolean(),
});

export type UpdateCryptoSettingInput = z.infer<typeof updateCryptoSettingSchema>;

/**
 * 暗号資産設定（支払い・セキュリティポリシー）を取得
 */
export async function getCryptoSettingAction(): Promise<GetCryptoSettingResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const setting = await getCryptoSetting(session.user.organizationId);

    if (!setting) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        id: setting.id,
        autoPaymentEnabled: setting.autoPaymentEnabled,
        maxAutoPaymentUsd: setting.maxAutoPaymentUsd,
        dailyPaymentLimit: setting.dailyPaymentLimit,
        dailyAmountLimitUsd: setting.dailyAmountLimitUsd,
        newAddressLockHours: setting.newAddressLockHours,
        require2FA: setting.require2FA,
        createdAt: setting.createdAt.toISOString(),
        updatedAt: setting.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Get crypto setting error:', error);
    return { success: false, error: '暗号資産設定の取得に失敗しました' };
  }
}

/**
 * 暗号資産設定（支払い・セキュリティポリシー）を更新
 */
export async function updateCryptoSettingAction(input: UpdateCryptoSettingInput): Promise<UpdateCryptoSettingResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = updateCryptoSettingSchema.parse(input);

    await updateCryptoSetting({
      organizationId: session.user.organizationId,
      autoPaymentEnabled: validated.autoPaymentEnabled,
      maxAutoPaymentUsd: validated.maxAutoPaymentUsd,
      dailyPaymentLimit: validated.dailyPaymentLimit,
      dailyAmountLimitUsd: validated.dailyAmountLimitUsd,
      newAddressLockHours: validated.newAddressLockHours,
      require2FA: validated.require2FA,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Update crypto setting error:', error);
    return { success: false, error: '暗号資産設定の更新に失敗しました' };
  }
}
