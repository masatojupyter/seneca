import crypto from 'crypto';

type PaymentHashData = {
  paymentRequestId: string;
  workerId: string;
  amountUsd: number;
  cryptoAmount: number;
  cryptoRate: number;
  applicationIds: string[];
  destinationAddress: string;
  timestamp: string;
};

/**
 * 支払いデータを正規化されたJSONに変換
 * キーをソートすることで、同じデータから常に同じJSONが生成される
 */
export function createCanonicalPaymentData(data: PaymentHashData): string {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(data).sort();
  for (const key of keys) {
    const value = data[key as keyof PaymentHashData];
    if (Array.isArray(value)) {
      sorted[key] = [...value].sort();
    } else {
      sorted[key] = value;
    }
  }
  return JSON.stringify(sorted);
}

/**
 * 正規化JSONからSHA-256ハッシュを生成
 * XRPLトランザクションのMemoに埋め込む監査用ハッシュ
 */
export function hashPaymentData(canonicalJson: string): string {
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * ハッシュの整合性を検証
 */
export function verifyPaymentHash(
  canonicalJson: string,
  expectedHash: string
): boolean {
  const computed = hashPaymentData(canonicalJson);
  return crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}
