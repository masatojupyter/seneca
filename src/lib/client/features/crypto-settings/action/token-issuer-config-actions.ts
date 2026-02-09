'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import {
  getTokenIssuerConfigSource,
  isRlusdConfiguredInEnv,
} from '@/lib/server/infra/token-issuer-config';
import {
  getAllTokenIssuerConfigs,
  createTokenIssuerConfig,
  updateTokenIssuerConfig,
  deleteTokenIssuerConfig,
} from '@/lib/server/repository/token-issuer-config-repository';
import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';

const cryptoTypeSchema = z.enum(['XRP', 'RLUSD']);

const createTokenIssuerConfigSchema = z.object({
  cryptoType: cryptoTypeSchema,
  issuerAddress: z.string().min(1, '発行者アドレスを入力してください'),
  currencyCode: z.string().min(1, '通貨コードを入力してください'),
  network: z.enum(['mainnet', 'testnet']).optional(),
});

const updateTokenIssuerConfigSchema = z.object({
  cryptoType: cryptoTypeSchema,
  issuerAddress: z.string().min(1).optional(),
  currencyCode: z.string().min(1).optional(),
  network: z.enum(['mainnet', 'testnet']).optional(),
  isActive: z.boolean().optional(),
});

export type TokenIssuerConfigItem = {
  id: string;
  cryptoType: CryptoType;
  issuerAddress: string;
  currencyCode: string;
  network: string;
  isActive: boolean;
  source: 'env' | 'db';
  createdAt: string;
  updatedAt: string;
};

export type GetTokenIssuerConfigsResult = {
  success: boolean;
  error?: string;
  configs?: TokenIssuerConfigItem[];
  envConfigured?: boolean;
};

export type CreateTokenIssuerConfigResult = {
  success: boolean;
  error?: string;
  config?: TokenIssuerConfigItem;
};

export type UpdateTokenIssuerConfigResult = {
  success: boolean;
  error?: string;
  config?: TokenIssuerConfigItem;
};

export type DeleteTokenIssuerConfigResult = {
  success: boolean;
  error?: string;
};

/**
 * TokenIssuerConfig一覧を取得（環境変数とDB両方）
 */
export async function getTokenIssuerConfigsAction(): Promise<GetTokenIssuerConfigsResult> {
  try {
    const session = await adminAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const envConfigured = isRlusdConfiguredInEnv();
    const configs: TokenIssuerConfigItem[] = [];

    // RLUSDの設定を取得（環境変数またはDB）
    const rlusdResult = await getTokenIssuerConfigSource('RLUSD');
    if (rlusdResult.config) {
      configs.push({
        id: rlusdResult.config.id,
        cryptoType: rlusdResult.config.cryptoType,
        issuerAddress: rlusdResult.config.issuerAddress,
        currencyCode: rlusdResult.config.currencyCode,
        network: rlusdResult.config.network,
        isActive: rlusdResult.config.isActive,
        source: rlusdResult.source as 'env' | 'db',
        createdAt: rlusdResult.config.createdAt.toISOString(),
        updatedAt: rlusdResult.config.updatedAt.toISOString(),
      });
    }

    return {
      success: true,
      configs,
      envConfigured,
    };
  } catch (error) {
    console.error('Get token issuer configs error:', error);
    return {
      success: false,
      error: 'トークン発行者設定の取得に失敗しました',
    };
  }
}

/**
 * TokenIssuerConfigを作成
 */
export async function createTokenIssuerConfigAction(
  data: z.infer<typeof createTokenIssuerConfigSchema>
): Promise<CreateTokenIssuerConfigResult> {
  try {
    const session = await adminAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = createTokenIssuerConfigSchema.parse(data);

    // 環境変数で設定されている場合はエラー
    if (validated.cryptoType === 'RLUSD' && isRlusdConfiguredInEnv()) {
      return {
        success: false,
        error: 'RLUSD設定は環境変数で設定されています。データベース設定を追加するには環境変数を削除してください。',
      };
    }

    const config = await createTokenIssuerConfig({
      cryptoType: validated.cryptoType,
      issuerAddress: validated.issuerAddress,
      currencyCode: validated.currencyCode,
      network: validated.network,
    });

    return {
      success: true,
      config: {
        id: config.id,
        cryptoType: config.cryptoType,
        issuerAddress: config.issuerAddress,
        currencyCode: config.currencyCode,
        network: config.network,
        isActive: config.isActive,
        source: 'db',
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error('Create token issuer config error:', error);
    return {
      success: false,
      error: 'トークン発行者設定の作成に失敗しました',
    };
  }
}

/**
 * TokenIssuerConfigを更新
 */
export async function updateTokenIssuerConfigAction(
  data: z.infer<typeof updateTokenIssuerConfigSchema>
): Promise<UpdateTokenIssuerConfigResult> {
  try {
    const session = await adminAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = updateTokenIssuerConfigSchema.parse(data);

    // 環境変数で設定されている場合はエラー
    if (validated.cryptoType === 'RLUSD' && isRlusdConfiguredInEnv()) {
      return {
        success: false,
        error: 'RLUSD設定は環境変数で設定されています。変更するには環境変数を更新してください。',
      };
    }

    const config = await updateTokenIssuerConfig({
      cryptoType: validated.cryptoType,
      issuerAddress: validated.issuerAddress,
      currencyCode: validated.currencyCode,
      network: validated.network,
      isActive: validated.isActive,
    });

    return {
      success: true,
      config: {
        id: config.id,
        cryptoType: config.cryptoType,
        issuerAddress: config.issuerAddress,
        currencyCode: config.currencyCode,
        network: config.network,
        isActive: config.isActive,
        source: 'db',
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    console.error('Update token issuer config error:', error);
    return {
      success: false,
      error: 'トークン発行者設定の更新に失敗しました',
    };
  }
}

/**
 * TokenIssuerConfigを削除
 */
export async function deleteTokenIssuerConfigAction(
  cryptoType: CryptoType
): Promise<DeleteTokenIssuerConfigResult> {
  try {
    const session = await adminAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    // 環境変数で設定されている場合はエラー
    if (cryptoType === 'RLUSD' && isRlusdConfiguredInEnv()) {
      return {
        success: false,
        error: 'RLUSD設定は環境変数で設定されています。削除するには環境変数を削除してください。',
      };
    }

    await deleteTokenIssuerConfig(cryptoType);

    return { success: true };
  } catch (error) {
    console.error('Delete token issuer config error:', error);
    return {
      success: false,
      error: 'トークン発行者設定の削除に失敗しました',
    };
  }
}
