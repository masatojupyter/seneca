import { prisma } from '@/lib/server/infra/prisma';
import type { PaymentStatus } from '@prisma/client';

export type PaymentRequestListItem = {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  applicationIds: string[];
  amountUsd: number;
  cryptoType: string;
  cryptoRate: number;
  cryptoAmount: number;
  status: string;
  transactionHash: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

/**
 * 組織の支払いリクエスト一覧を取得
 */
export async function getOrganizationPaymentRequests(
  organizationId: string,
  status?: string
): Promise<PaymentRequestListItem[]> {
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      worker: { organizationId },
      ...(status && { status: status as PaymentStatus }),
    },
    include: {
      worker: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return paymentRequests.map((req) => ({
    id: req.id,
    workerId: req.workerId,
    workerName: req.worker.name,
    workerEmail: req.worker.email,
    applicationIds: req.applicationIds,
    amountUsd: Number(req.amountUsd),
    cryptoType: req.cryptoType,
    cryptoRate: Number(req.cryptoRate),
    cryptoAmount: Number(req.cryptoAmount),
    status: req.status,
    transactionHash: req.transactionHash,
    processedAt: req.processedAt,
    createdAt: req.createdAt,
  }));
}
