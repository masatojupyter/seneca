import type { CryptoType } from '@/lib/shared/entity';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

type CoinGeckoResponse = {
  ripple?: {
    usd?: number;
  };
};

/**
 * CoinGecko APIからXRP/USDレートを取得
 * API失敗時は0を返す（UIでレート取得失敗を表示）
 */
export async function getXrpUsdRate(): Promise<number> {
  try {
    const url = `${COINGECKO_API_URL}?ids=ripple&vs_currencies=usd`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return 0;
    }

    const data = (await response.json()) as CoinGeckoResponse;
    const rate = data.ripple?.usd;

    if (typeof rate !== 'number' || rate <= 0) {
      console.error('Invalid rate from CoinGecko:', data);
      return 0;
    }

    return rate;
  } catch (error) {
    console.error('Failed to fetch XRP/USD rate:', error);
    return 0;
  }
}

/**
 * RLUSD/USDレートを取得
 * RLUSDはUSD連動ステーブルコインのため、常に1.0を返す
 */
export function getRlusdUsdRate(): number {
  return 1.0;
}

/**
 * 通貨タイプに応じたUSDレートを取得
 */
export async function getCryptoUsdRate(cryptoType: CryptoType): Promise<number> {
  switch (cryptoType) {
    case 'XRP':
      return await getXrpUsdRate();
    case 'RLUSD':
      return getRlusdUsdRate();
    default:
      return 0;
  }
}

/**
 * USDからクリプト金額を計算
 */
export async function convertUsdToCrypto(
  amountUsd: number,
  cryptoType: CryptoType
): Promise<{ cryptoAmount: number; rate: number }> {
  const rate = await getCryptoUsdRate(cryptoType);
  if (rate <= 0) {
    throw new Error(`${cryptoType}のレートを取得できませんでした`);
  }
  const cryptoAmount = amountUsd / rate;
  return { cryptoAmount, rate };
}
