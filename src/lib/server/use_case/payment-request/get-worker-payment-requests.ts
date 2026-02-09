import { prisma } from '@/lib/server/infra/prisma';

type PaymentRequest = {
  id: string;
  workerId: string;
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
 * 従業員の支払いリクエスト一覧を取得
 */
export async function getWorkerPaymentRequests(workerId: string): Promise<PaymentRequest[]> {
  const requests = await prisma.paymentRequest.findMany({
    where: { workerId },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((req) => ({
    id: req.id,
    workerId: req.workerId,
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
