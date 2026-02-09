'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getOrganizationWallets } from '@/lib/server/use_case/admin/get-organization-wallets';
import { createOrganizationWallet } from '@/lib/server/use_case/admin/create-organization-wallet';
import { deleteOrganizationWallet } from '@/lib/server/use_case/admin/delete-organization-wallet';
import { getWalletBalances } from '@/lib/server/gateway/crypto-payment-gateway';
import { getTokenIssuerConfig } from '@/lib/server/infra/token-issuer-config';
import { prisma } from '@/lib/server/infra/prisma';

const createWalletSchema = z.object({
  cryptoType: z.literal('XRP'),
  walletAddress: z.string().min(1, 'ウォレットアドレスは必須です'),
  walletSecret: z.string().min(1, 'ウォレットシークレットは必須です'),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GemWalletモード用（シークレット不要）
const createGemWalletSchema = z.object({
  cryptoType: z.enum(['XRP', 'RLUSD']),
  walletAddress: z.string().min(1, 'ウォレットアドレスは必須です'),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const updateWalletSchema = z.object({
  id: z.string(),
  isDefault: z.boolean().optional(),
});

const deleteWalletSchema = z.object({
  id: z.string(),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type CreateGemWalletInput = z.infer<typeof createGemWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
export type DeleteWalletInput = z.infer<typeof deleteWalletSchema>;

export type OrganizationWalletItem = {
  id: string;
  organizationId: string;
  cryptoType: string;
  walletAddress: string;
  label: string | null;
  requiresManualSigning: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetWalletsResult = {
  success: boolean;
  error?: string;
  wallets?: OrganizationWalletItem[];
};

export type CreateWalletResult = {
  success: boolean;
  error?: string;
};

export type UpdateWalletResult = {
  success: boolean;
  error?: string;
};

export type DeleteWalletResult = {
  success: boolean;
  error?: string;
};

export type WalletBalanceResult = {
  success: boolean;
  error?: string;
  xrp?: number;
  rlusd?: number;
  rlusdConfigured?: boolean;
};

/**
 * 組織ウォレット一覧を取得
 */
export async function getOrganizationWalletsAction(): Promise<GetWalletsResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const wallets = await getOrganizationWallets(session.user.organizationId);

    return {
      success: true,
      wallets: wallets.map((w) => ({
        id: w.id,
        organizationId: w.organizationId,
        cryptoType: w.cryptoType,
        walletAddress: w.walletAddress,
        label: w.label,
        requiresManualSigning: w.requiresManualSigning,
        isDefault: w.isDefault,
        isActive: w.isActive,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Get organization wallets error:', error);
    return { success: false, error: 'ウォレット一覧の取得に失敗しました' };
  }
}

/**
 * 組織ウォレットを追加
 */
export async function createOrganizationWalletAction(data: CreateWalletInput): Promise<CreateWalletResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = createWalletSchema.parse(data);

    await createOrganizationWallet({
      organizationId: session.user.organizationId,
      cryptoType: validated.cryptoType,
      walletAddress: validated.walletAddress,
      walletSecret: validated.walletSecret,
      label: validated.label,
      isDefault: validated.isDefault,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Create organization wallet error:', error);
    return { success: false, error: 'ウォレットの追加に失敗しました' };
  }
}

/**
 * GemWalletアドレスを組織ウォレットとして追加（シークレット不要、手動署名モード）
 */
export async function createGemWalletOrganizationWalletAction(data: CreateGemWalletInput): Promise<CreateWalletResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = createGemWalletSchema.parse(data);
    const organizationId = session.user.organizationId;

    // 既存のウォレットをチェック
    const existing = await prisma.organizationWallet.findFirst({
      where: {
        organizationId,
        walletAddress: validated.walletAddress,
        cryptoType: validated.cryptoType,
      },
    });

    if (existing) {
      return { success: false, error: 'このアドレスは既に登録されています' };
    }

    // デフォルト設定の場合、既存のデフォルトを解除
    if (validated.isDefault) {
      await prisma.organizationWallet.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // GemWalletウォレットを作成（シークレットなし、手動署名フラグON）
    await prisma.organizationWallet.create({
      data: {
        organizationId,
        cryptoType: validated.cryptoType,
        walletAddress: validated.walletAddress,
        walletSecretEnc: null, // シークレットなし
        label: validated.label ?? `GemWallet (${validated.cryptoType})`,
        requiresManualSigning: true, // 手動署名が必要
        isDefault: validated.isDefault ?? false,
        isActive: true,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Create GemWallet organization wallet error:', error);
    return { success: false, error: 'GemWalletウォレットの追加に失敗しました' };
  }
}

/**
 * 組織ウォレットをデフォルトに設定
 */
export async function updateOrganizationWalletAction(data: UpdateWalletInput): Promise<UpdateWalletResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = updateWalletSchema.parse(data);
    const organizationId = session.user.organizationId;

    // ウォレットが組織に属しているか確認
    const wallet = await prisma.organizationWallet.findFirst({
      where: { id: validated.id, organizationId },
    });

    if (!wallet) {
      return { success: false, error: 'ウォレットが見つかりません' };
    }

    if (validated.isDefault) {
      // 既存のデフォルトを解除
      await prisma.organizationWallet.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });

      // 新しいデフォルトを設定
      await prisma.organizationWallet.update({
        where: { id: validated.id },
        data: { isDefault: true },
      });
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Update organization wallet error:', error);
    return { success: false, error: 'ウォレットの更新に失敗しました' };
  }
}

/**
 * 組織ウォレットを削除
 */
export async function deleteOrganizationWalletAction(data: DeleteWalletInput): Promise<DeleteWalletResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = deleteWalletSchema.parse(data);

    await deleteOrganizationWallet({
      id: validated.id,
      organizationId: session.user.organizationId,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Delete organization wallet error:', error);
    return { success: false, error: 'ウォレットの削除に失敗しました' };
  }
}

/**
 * ウォレット残高を取得（XRPとRLUSD）
 */
export async function getWalletBalanceAction(walletAddress: string): Promise<WalletBalanceResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    // ウォレットが組織に属しているか確認
    const wallet = await prisma.organizationWallet.findFirst({
      where: {
        walletAddress,
        organizationId: session.user.organizationId,
      },
    });

    if (!wallet) {
      return { success: false, error: 'ウォレットが見つかりません' };
    }

    // RLUSD設定を取得
    const tokenIssuerConfig = await getTokenIssuerConfig('RLUSD');

    // 残高を取得
    const balances = await getWalletBalances(walletAddress, tokenIssuerConfig);

    return {
      success: true,
      xrp: balances.xrp,
      rlusd: balances.rlusd,
      rlusdConfigured: !!tokenIssuerConfig,
    };
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return { success: false, error: '残高の取得に失敗しました' };
  }
}
