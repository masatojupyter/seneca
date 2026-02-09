import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import { getCryptoUsdRate } from '@/lib/server/gateway/exchange-rate-gateway';
import type { TimeApplication } from '@/lib/server/repository/time-application-repository';
import type { CryptoType } from '@/lib/shared/entity';

type CreatePaymentRequestInput = {
  workerId: string;
  applicationIds: string[];
  cryptoType: CryptoType;
};

type PaymentRequest = {
  id: string;
  workerId: string;
  applicationIds: string[];
  amountUsd: number;
  cryptoType: CryptoType;
  cryptoRate: number;
  cryptoAmount: number;
  status: string;
  createdAt: Date;
};

/**
 * 為替レートを取得
 * 取得したレートをexchange_rate_historyに記録
 */
async function fetchCryptoRate(cryptoType: CryptoType): Promise<number> {
  const rate = await getCryptoUsdRate(cryptoType);

  if (rate <= 0) {
    throw new Error('為替レートの取得に失敗しました。しばらくしてから再度お試しください。');
  }

  const source = cryptoType === 'RLUSD' ? 'fixed' : 'coingecko';
  await queryTimescale(
    `INSERT INTO exchange_rate_history (source, crypto, fiat, rate)
     VALUES ($1, $2, $3, $4)`,
    [source, cryptoType, 'USD', rate]
  );

  return rate;
}

/**
 * 給与受領リクエストを作成
 */
export async function createPaymentRequest(
  input: CreatePaymentRequestInput
): Promise<PaymentRequest> {
  const { workerId, applicationIds, cryptoType } = input;

  // TimescaleDBから申請を取得（承認済みで未受領）
  const applications = await queryTimescale<TimeApplication>(
    `SELECT
      id,
      worker_id as "workerId",
      total_amount_usd as "totalAmountUsd",
      status,
      payment_request_id as "paymentRequestId"
    FROM time_applications
    WHERE id = ANY($1) AND worker_id = $2 AND status = 'APPROVED'`,
    [applicationIds, workerId]
  );

  if (applications.length === 0) {
    throw new Error('承認済みの申請が見つかりません');
  }

  if (applications.length !== applicationIds.length) {
    throw new Error('一部の申請が見つからないか、条件を満たしていません');
  }

  // 既に支払いリクエストがある申請をチェック
  const alreadyRequested = applications.filter(app => app.paymentRequestId !== null);
  if (alreadyRequested.length > 0) {
    throw new Error('既に支払いリクエストが存在する申請が含まれています');
  }

  // 合計金額を計算
  const amountUsd = applications.reduce((sum, app) => sum + Number(app.totalAmountUsd), 0);

  // 為替レートを取得
  const cryptoRate = await fetchCryptoRate(cryptoType);

  // 暗号資産数量を計算
  const cryptoAmount = amountUsd / cryptoRate;

  // PaymentRequestを作成（PostgreSQL）
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      workerId,
      applicationIds,
      amountUsd,
      cryptoType,
      cryptoRate,
      cryptoAmount,
      status: 'PENDING',
    },
  });

  // TimescaleDBの申請ステータスを更新（REQUESTED: 支払いリクエスト作成済み）
  await queryTimescale(
    `UPDATE time_applications
    SET status = 'REQUESTED', payment_request_id = $1, updated_at = NOW()
    WHERE id = ANY($2)`,
    [paymentRequest.id, applicationIds]
  );

  // ログを記録
  await queryTimescale(
    `
    INSERT INTO payment_request_logs (
      payment_request_id,
      worker_id,
      action,
      application_ids,
      amount_usd,
      crypto_type,
      crypto_rate,
      crypto_amount,
      previous_status,
      new_status,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      paymentRequest.id,
      workerId,
      'CREATED',
      applicationIds,
      amountUsd,
      cryptoType,
      cryptoRate,
      cryptoAmount,
      null,
      'PENDING',
      new Date(),
    ]
  );

  return {
    id: paymentRequest.id,
    workerId: paymentRequest.workerId,
    applicationIds: paymentRequest.applicationIds,
    amountUsd: Number(paymentRequest.amountUsd),
    cryptoType: paymentRequest.cryptoType,
    cryptoRate: Number(paymentRequest.cryptoRate),
    cryptoAmount: Number(paymentRequest.cryptoAmount),
    status: paymentRequest.status,
    createdAt: paymentRequest.createdAt,
  };
}
