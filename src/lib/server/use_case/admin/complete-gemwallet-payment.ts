import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import type { CryptoType } from '@/lib/shared/entity';

export type CompleteGemWalletPaymentInput = {
  paymentRequestId: string;
  transactionHash: string;
  organizationId: string;
  adminId: string;
};

/**
 * GemWalletで署名された支払いを完了
 */
export async function completeGemWalletPayment(
  input: CompleteGemWalletPaymentInput
): Promise<void> {
  const { paymentRequestId, transactionHash, organizationId, adminId } = input;

  // 1. 支払いリクエストが存在し、PENDINGステータスか確認
  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      id: paymentRequestId,
      worker: { organizationId },
      status: 'PENDING',
    },
    include: {
      worker: {
        select: {
          id: true,
          cryptoAddresses: {
            where: { isDefault: true, isActive: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!paymentRequest) {
    throw new Error('実行可能な支払いリクエストが見つかりません');
  }

  const cryptoAddress = paymentRequest.worker.cryptoAddresses[0];
  if (!cryptoAddress) {
    throw new Error('従業員の暗号資産アドレスが設定されていません');
  }

  // 2. 支払いリクエストをCOMPLETEDに更新
  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      status: 'COMPLETED',
      transactionHash,
      approvedBy: adminId,
      approvedAt: new Date(),
      processedAt: new Date(),
    },
  });

  // 3. TimescaleDB の申請ステータスを PAID に更新
  await queryTimescale(
    `UPDATE time_applications
    SET status = 'PAID', updated_at = NOW()
    WHERE id = ANY($1)`,
    [paymentRequest.applicationIds]
  );

  // 4. TimescaleDBにログ記録
  await Promise.all([
    // payment_transactions
    queryTimescale(
      `INSERT INTO payment_transactions (
        payment_request_id, organization_id, worker_id,
        amount_usd, crypto_type, crypto_rate, crypto_amount,
        transaction_hash, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        paymentRequestId,
        organizationId,
        paymentRequest.workerId,
        Number(paymentRequest.amountUsd),
        paymentRequest.cryptoType,
        Number(paymentRequest.cryptoRate),
        Number(paymentRequest.cryptoAmount),
        transactionHash,
        'COMPLETED',
      ]
    ),
    // payment_request_logs
    queryTimescale(
      `INSERT INTO payment_request_logs (
        payment_request_id, worker_id, action,
        amount_usd, crypto_type, crypto_rate, crypto_amount,
        crypto_address, previous_status, new_status,
        admin_id, transaction_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        paymentRequestId,
        paymentRequest.workerId,
        'COMPLETED',
        Number(paymentRequest.amountUsd),
        paymentRequest.cryptoType,
        Number(paymentRequest.cryptoRate),
        Number(paymentRequest.cryptoAmount),
        cryptoAddress.address,
        'PENDING',
        'COMPLETED',
        adminId,
        transactionHash,
      ]
    ),
    // payment_hash_logs（dataHashがあれば）
    paymentRequest.dataHash
      ? queryTimescale(
          `INSERT INTO payment_hash_logs (
            payment_request_id, data_hash, canonical_data,
            transaction_hash
          ) VALUES ($1, $2, $3::jsonb, $4)`,
          [
            paymentRequestId,
            paymentRequest.dataHash,
            paymentRequest.canonicalDataJson,
            transactionHash,
          ]
        )
      : Promise.resolve(),
  ]);
}
