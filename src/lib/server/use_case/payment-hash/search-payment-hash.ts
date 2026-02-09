import { queryTimescale } from '@/lib/server/infra/timescale';
import { prisma } from '@/lib/server/infra/prisma';

type PaymentHashLogRow = {
  id: string;
  payment_request_id: string;
  data_hash: string;
  canonical_data: Record<string, unknown>;
  transaction_hash: string | null;
  verified_at: string | null;
  verification_result: boolean | null;
  created_at: string;
};

export type PaymentHashSearchResult = {
  id: string;
  paymentRequestId: string;
  dataHash: string;
  canonicalData: {
    paymentRequestId: string;
    workerId: string;
    amountUsd: number;
    cryptoAmount: number;
    cryptoRate: number;
    applicationIds: string[];
    destinationAddress: string;
    timestamp: string;
  };
  transactionHash: string | null;
  verifiedAt: string | null;
  verificationResult: boolean | null;
  createdAt: string;
  organizationName?: string;
  workerName?: string;
  workerEmail?: string;
};

/**
 * TimescaleDBからdata_hashでpayment_hash_logsを検索
 */
async function findByDataHash(
  dataHash: string
): Promise<PaymentHashLogRow[]> {
  return queryTimescale<PaymentHashLogRow>(
    `SELECT id, payment_request_id, data_hash, canonical_data,
            transaction_hash, verified_at, verification_result, created_at
     FROM payment_hash_logs
     WHERE data_hash = $1
     ORDER BY created_at DESC`,
    [dataHash]
  );
}

/**
 * PaymentHashLogRowをPaymentHashSearchResultに変換
 */
type PaymentRequestInfo = {
  organizationName?: string;
  workerName?: string;
  workerEmail?: string;
};

function toSearchResult(
  row: PaymentHashLogRow,
  info?: PaymentRequestInfo
): PaymentHashSearchResult {
  const canonical = row.canonical_data as PaymentHashSearchResult['canonicalData'];
  return {
    id: row.id,
    paymentRequestId: row.payment_request_id,
    dataHash: row.data_hash,
    canonicalData: canonical,
    transactionHash: row.transaction_hash,
    verifiedAt: row.verified_at,
    verificationResult: row.verification_result,
    createdAt: row.created_at,
    organizationName: info?.organizationName,
    workerName: info?.workerName,
    workerEmail: info?.workerEmail,
  };
}

/**
 * 従業員用: data_hashで検索し、自分のデータのみ返す
 */
export async function searchPaymentHashForWorker(
  dataHash: string,
  workerId: string
): Promise<PaymentHashSearchResult[]> {
  const rows = await findByDataHash(dataHash);
  if (rows.length === 0) {
    return [];
  }

  const paymentRequestIds = rows.map((r) => r.payment_request_id);
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      id: { in: paymentRequestIds },
      workerId,
    },
    select: {
      id: true,
      worker: {
        select: {
          name: true,
          email: true,
          organization: {
            select: { name: true },
          },
        },
      },
    },
  });

  const allowedMap = new Map(
    paymentRequests.map((pr) => [
      pr.id,
      {
        organizationName: pr.worker.organization.name,
        workerName: pr.worker.name,
        workerEmail: pr.worker.email,
      },
    ])
  );

  return rows
    .filter((row) => allowedMap.has(row.payment_request_id))
    .map((row) => toSearchResult(row, allowedMap.get(row.payment_request_id)));
}

/**
 * 管理者用: data_hashで検索し、自組織の従業員データのみ返す
 */
export async function searchPaymentHashForAdmin(
  dataHash: string,
  organizationId: string
): Promise<PaymentHashSearchResult[]> {
  const rows = await findByDataHash(dataHash);
  if (rows.length === 0) {
    return [];
  }

  const paymentRequestIds = rows.map((r) => r.payment_request_id);
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      id: { in: paymentRequestIds },
      worker: {
        organizationId,
      },
    },
    select: {
      id: true,
      worker: {
        select: {
          name: true,
          email: true,
          organization: {
            select: { name: true },
          },
        },
      },
    },
  });

  const allowedMap = new Map(
    paymentRequests.map((pr) => [
      pr.id,
      {
        organizationName: pr.worker.organization.name,
        workerName: pr.worker.name,
        workerEmail: pr.worker.email,
      },
    ])
  );

  return rows
    .filter((row) => allowedMap.has(row.payment_request_id))
    .map((row) => toSearchResult(row, allowedMap.get(row.payment_request_id)));
}
