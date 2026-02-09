import { prisma } from '@/lib/server/infra/prisma';
import { findApplicationById } from '@/lib/server/repository/time-application-repository';
import { getTokenIssuerConfig } from '@/lib/server/infra/token-issuer-config';
import { requiresTrustlineValidation } from '@/lib/server/gateway/trustline-gateway';

export type PaymentRequestDetail = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  workerCryptoAddress: string | null;
  applicationIds: string[];
  applications: Array<{
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    totalMinutes: number;
    totalAmountUsd: number;
    status: string;
  }>;
  amountUsd: number;
  cryptoType: string;
  cryptoRate: number;
  cryptoAmount: number;
  status: string;
  transactionHash: string | null;
  dataHash: string | null;
  processedAt: Date | null;
  createdAt: Date;
  // GemWallet支払い用の追加情報
  organizationWallet: {
    address: string;
    requiresManualSigning: boolean;
  } | null;
  tokenIssuer?: {
    address: string;
    currencyCode: string;
  };
};

/**
 * 支払いリクエストの詳細情報を取得
 */
export async function getPaymentRequestDetail(
  paymentRequestId: string,
  organizationId: string
): Promise<PaymentRequestDetail | null> {
  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      id: paymentRequestId,
      worker: { organizationId },
    },
    include: {
      worker: {
        select: {
          name: true,
          email: true,
          cryptoAddresses: {
            where: { isDefault: true, isActive: true },
            take: 1,
            select: {
              address: true,
            },
          },
        },
      },
    },
  });

  if (!paymentRequest) {
    return null;
  }

  // 組織のデフォルトウォレット取得
  const orgWallet = await prisma.organizationWallet.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
    select: {
      walletAddress: true,
      requiresManualSigning: true,
    },
  });

  // トークン発行者設定取得（RLUSD等の場合）
  let tokenIssuer: { address: string; currencyCode: string } | undefined;
  if (requiresTrustlineValidation(paymentRequest.cryptoType)) {
    const config = await getTokenIssuerConfig(paymentRequest.cryptoType);
    if (config) {
      tokenIssuer = {
        address: config.issuerAddress,
        currencyCode: config.currencyCode,
      };
    }
  }

  const applicationResults = await Promise.all(
    paymentRequest.applicationIds.map((id) => findApplicationById(id))
  );
  const applications = applicationResults.filter(
    (app): app is NonNullable<typeof app> => app !== null
  );

  return {
    id: paymentRequest.id,
    workerId: paymentRequest.workerId,
    workerName: paymentRequest.worker.name,
    workerEmail: paymentRequest.worker.email,
    workerCryptoAddress: paymentRequest.worker.cryptoAddresses[0]?.address || null,
    applicationIds: paymentRequest.applicationIds,
    applications: applications.map((app) => ({
      id: app.id,
      type: app.type,
      startDate: app.startDate,
      endDate: app.endDate,
      totalMinutes: Number(app.totalMinutes),
      totalAmountUsd: Number(app.totalAmountUsd),
      status: app.status,
    })),
    amountUsd: Number(paymentRequest.amountUsd),
    cryptoType: paymentRequest.cryptoType,
    cryptoRate: Number(paymentRequest.cryptoRate),
    cryptoAmount: Number(paymentRequest.cryptoAmount),
    status: paymentRequest.status,
    transactionHash: paymentRequest.transactionHash,
    dataHash: paymentRequest.dataHash,
    processedAt: paymentRequest.processedAt,
    createdAt: paymentRequest.createdAt,
    organizationWallet: orgWallet
      ? {
          address: orgWallet.walletAddress,
          requiresManualSigning: orgWallet.requiresManualSigning,
        }
      : null,
    tokenIssuer,
  };
}
