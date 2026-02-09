import { prisma } from '@/lib/server/infra/prisma';
import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';

/**
 * TokenIssuerConfigをデータベースから取得
 */
export async function getTokenIssuerConfigFromDb(
  cryptoType: CryptoType
): Promise<TokenIssuerConfig | null> {
  const config = await prisma.tokenIssuerConfig.findUnique({
    where: { cryptoType },
  });

  if (!config) {
    return null;
  }

  return {
    id: config.id,
    cryptoType: config.cryptoType as CryptoType,
    issuerAddress: config.issuerAddress,
    currencyCode: config.currencyCode,
    network: config.network,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * すべてのTokenIssuerConfigを取得
 */
export async function getAllTokenIssuerConfigs(): Promise<TokenIssuerConfig[]> {
  const configs = await prisma.tokenIssuerConfig.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return configs.map((config) => ({
    id: config.id,
    cryptoType: config.cryptoType as CryptoType,
    issuerAddress: config.issuerAddress,
    currencyCode: config.currencyCode,
    network: config.network,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }));
}

type CreateTokenIssuerConfigInput = {
  cryptoType: CryptoType;
  issuerAddress: string;
  currencyCode: string;
  network?: string;
};

/**
 * TokenIssuerConfigを作成
 */
export async function createTokenIssuerConfig(
  input: CreateTokenIssuerConfigInput
): Promise<TokenIssuerConfig> {
  const config = await prisma.tokenIssuerConfig.create({
    data: {
      cryptoType: input.cryptoType,
      issuerAddress: input.issuerAddress,
      currencyCode: input.currencyCode,
      network: input.network ?? 'mainnet',
      isActive: true,
    },
  });

  return {
    id: config.id,
    cryptoType: config.cryptoType as CryptoType,
    issuerAddress: config.issuerAddress,
    currencyCode: config.currencyCode,
    network: config.network,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

type UpdateTokenIssuerConfigInput = {
  cryptoType: CryptoType;
  issuerAddress?: string;
  currencyCode?: string;
  network?: string;
  isActive?: boolean;
};

/**
 * TokenIssuerConfigを更新
 */
export async function updateTokenIssuerConfig(
  input: UpdateTokenIssuerConfigInput
): Promise<TokenIssuerConfig> {
  const config = await prisma.tokenIssuerConfig.update({
    where: { cryptoType: input.cryptoType },
    data: {
      issuerAddress: input.issuerAddress,
      currencyCode: input.currencyCode,
      network: input.network,
      isActive: input.isActive,
    },
  });

  return {
    id: config.id,
    cryptoType: config.cryptoType as CryptoType,
    issuerAddress: config.issuerAddress,
    currencyCode: config.currencyCode,
    network: config.network,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * TokenIssuerConfigを削除
 */
export async function deleteTokenIssuerConfig(cryptoType: CryptoType): Promise<void> {
  await prisma.tokenIssuerConfig.delete({
    where: { cryptoType },
  });
}
