import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';
import { getTokenIssuerConfigFromDb } from '@/lib/server/repository/token-issuer-config-repository';

/**
 * 環境変数からRLUSD発行者設定を取得（同期版）
 *
 * 環境変数:
 * - RLUSD_ISSUER_ADDRESS: RLUSD発行者アドレス（必須）
 * - RLUSD_CURRENCY_CODE: 通貨コード（デフォルト: RLUSD）
 * - XRPL_NETWORK: ネットワーク（testnet or mainnet）
 */
export function getTokenIssuerConfigFromEnv(cryptoType: CryptoType): TokenIssuerConfig | undefined {
  if (cryptoType !== 'RLUSD') {
    return undefined;
  }

  const issuerAddress = process.env.RLUSD_ISSUER_ADDRESS;
  if (!issuerAddress) {
    return undefined;
  }

  const currencyCode = process.env.RLUSD_CURRENCY_CODE ?? 'RLUSD';
  const network = process.env.XRPL_NETWORK ?? 'testnet';

  return {
    id: 'env-config',
    cryptoType: 'RLUSD',
    issuerAddress,
    currencyCode,
    network,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * TokenIssuerConfigを取得（環境変数 → データベースの優先順位）
 * 環境変数が設定されている場合は環境変数を優先
 */
export async function getTokenIssuerConfig(
  cryptoType: CryptoType
): Promise<TokenIssuerConfig | undefined> {
  // 1. まず環境変数をチェック
  const envConfig = getTokenIssuerConfigFromEnv(cryptoType);
  if (envConfig) {
    return envConfig;
  }

  // 2. 環境変数になければデータベースをチェック
  const dbConfig = await getTokenIssuerConfigFromDb(cryptoType);
  return dbConfig ?? undefined;
}

/**
 * RLUSD発行者設定が有効かどうかを確認（環境変数のみ）
 */
export function isRlusdConfiguredInEnv(): boolean {
  return !!process.env.RLUSD_ISSUER_ADDRESS;
}

/**
 * RLUSD発行者設定が有効かどうかを確認（環境変数 + データベース）
 */
export async function isRlusdConfigured(): Promise<boolean> {
  if (isRlusdConfiguredInEnv()) {
    return true;
  }
  const dbConfig = await getTokenIssuerConfigFromDb('RLUSD');
  return !!dbConfig?.isActive;
}

/**
 * RLUSD発行者アドレスを取得（エラーをスロー）
 */
export async function requireTokenIssuerConfig(
  cryptoType: CryptoType
): Promise<TokenIssuerConfig> {
  const config = await getTokenIssuerConfig(cryptoType);
  if (!config) {
    throw new Error(
      `${cryptoType}の発行者設定が見つかりません。環境変数 RLUSD_ISSUER_ADDRESS を設定するか、管理画面から設定してください。`
    );
  }
  return config;
}

/**
 * 設定のソースを取得（表示用）
 */
export type ConfigSource = 'env' | 'db' | 'none';

export async function getTokenIssuerConfigSource(
  cryptoType: CryptoType
): Promise<{ source: ConfigSource; config: TokenIssuerConfig | null }> {
  // 環境変数を優先
  const envConfig = getTokenIssuerConfigFromEnv(cryptoType);
  if (envConfig) {
    return { source: 'env', config: envConfig };
  }

  // データベースをチェック
  const dbConfig = await getTokenIssuerConfigFromDb(cryptoType);
  if (dbConfig) {
    return { source: 'db', config: dbConfig };
  }

  return { source: 'none', config: null };
}
