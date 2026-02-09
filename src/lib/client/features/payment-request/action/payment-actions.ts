'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getApprovedApplications } from '@/lib/server/use_case/payment-request/get-approved-applications';
import { createPaymentRequest } from '@/lib/server/use_case/payment-request/create-payment-request';
import { getWorkerPaymentRequests } from '@/lib/server/use_case/payment-request/get-worker-payment-requests';
import { receivePayment } from '@/lib/server/use_case/payment-request/receive-payment';
import { getCryptoUsdRate } from '@/lib/server/gateway/exchange-rate-gateway';
import type { CryptoType } from '@/lib/shared/entity';

const cryptoTypeSchema = z.enum(['XRP', 'RLUSD']);

const createPaymentRequestSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1, '少なくとも1つの申請を選択してください'),
  cryptoType: cryptoTypeSchema,
});

export type CreatePaymentRequestInput = z.infer<typeof createPaymentRequestSchema>;

export type ApprovedApplicationItem = {
  id: string;
  workerId: string;
  type: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalAmountUsd: number;
  status: string;
  memo: string | null;
  createdAt: string;
};

export type PaymentRequestItem = {
  id: string;
  workerId: string;
  applicationIds: string[];
  amountUsd: number;
  cryptoType: string;
  cryptoRate: number;
  cryptoAmount: number;
  status: string;
  transactionHash: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type GetApprovedApplicationsResult = {
  success: boolean;
  error?: string;
  applications?: ApprovedApplicationItem[];
};

export type CreatePaymentRequestResult = {
  success: boolean;
  error?: string;
  paymentRequest?: PaymentRequestItem;
};

export type GetPaymentRequestsResult = {
  success: boolean;
  error?: string;
  paymentRequests?: PaymentRequestItem[];
};

export type GetExchangeRateResult = {
  success: boolean;
  error?: string;
  rate?: number;
};

export type ReceivePaymentResult = {
  success: boolean;
  error?: string;
  paymentRequestId?: string;
  transactionHash?: string | null;
  amountUsd?: number;
  cryptoRate?: number;
  cryptoAmount?: number;
  destinationAddress?: string;
  requiresManualSigning?: boolean;
};

/**
 * 承認済み申請を取得
 */
export async function getApprovedApplicationsAction(): Promise<GetApprovedApplicationsResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const applications = await getApprovedApplications(session.user.id);

    return {
      success: true,
      applications: applications.map((app) => ({
        id: app.id,
        workerId: app.workerId,
        type: app.type,
        startDate: app.startDate.toISOString(),
        endDate: app.endDate.toISOString(),
        totalMinutes: app.totalMinutes,
        totalAmountUsd: app.totalAmountUsd,
        status: app.status,
        memo: app.memo,
        createdAt: app.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get approved applications error:', error);
    return {
      success: false,
      error: '承認済み申請の取得に失敗しました',
    };
  }
}

/**
 * 給与受領リクエストを作成
 */
export async function createPaymentRequestAction(
  data: CreatePaymentRequestInput
): Promise<CreatePaymentRequestResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = createPaymentRequestSchema.parse(data);

    const paymentRequest = await createPaymentRequest({
      workerId: session.user.id,
      applicationIds: validatedData.applicationIds,
      cryptoType: validatedData.cryptoType,
    });

    return {
      success: true,
      paymentRequest: {
        id: paymentRequest.id,
        workerId: paymentRequest.workerId,
        applicationIds: paymentRequest.applicationIds,
        amountUsd: paymentRequest.amountUsd,
        cryptoType: paymentRequest.cryptoType,
        cryptoRate: paymentRequest.cryptoRate,
        cryptoAmount: paymentRequest.cryptoAmount,
        status: paymentRequest.status,
        transactionHash: null,
        processedAt: null,
        createdAt: paymentRequest.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Create payment request error:', error);
    return {
      success: false,
      error: '給与受領リクエストの作成に失敗しました',
    };
  }
}

/**
 * 支払いリクエスト一覧を取得
 */
export async function getPaymentRequestsAction(): Promise<GetPaymentRequestsResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const requests = await getWorkerPaymentRequests(session.user.id);

    return {
      success: true,
      paymentRequests: requests.map((req) => ({
        id: req.id,
        workerId: req.workerId,
        applicationIds: req.applicationIds,
        amountUsd: req.amountUsd,
        cryptoType: req.cryptoType,
        cryptoRate: req.cryptoRate,
        cryptoAmount: req.cryptoAmount,
        status: req.status,
        transactionHash: req.transactionHash,
        processedAt: req.processedAt ? req.processedAt.toISOString() : null,
        createdAt: req.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get payment requests error:', error);
    return {
      success: false,
      error: '支払いリクエストの取得に失敗しました',
    };
  }
}

/**
 * 現在の為替レートを取得（XRP or RLUSD）
 */
export async function getExchangeRateAction(
  cryptoType: CryptoType = 'XRP'
): Promise<GetExchangeRateResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const rate = await getCryptoUsdRate(cryptoType);
    if (rate <= 0) {
      return { success: false, error: '為替レートの取得に失敗しました' };
    }

    return { success: true, rate };
  } catch (error) {
    console.error('Get exchange rate error:', error);
    return { success: false, error: '為替レートの取得に失敗しました' };
  }
}

const receivePaymentSchema = z.object({
  applicationIds: z
    .array(z.string().min(1))
    .min(1, '少なくとも1つの申請を選択してください'),
  cryptoType: cryptoTypeSchema.optional(),
});

/**
 * 承認済み申請の給与受領を実行（PaymentRequest作成 + 送金を1ステップで）
 */
export async function receivePaymentAction(
  data: { applicationIds: string[]; cryptoType?: CryptoType }
): Promise<ReceivePaymentResult> {
  try {
    const session = await workerAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = receivePaymentSchema.parse(data);

    const result = await receivePayment({
      workerId: session.user.id,
      organizationId: session.user.organizationId,
      applicationIds: validated.applicationIds,
      cryptoType: validated.cryptoType,
    });

    return {
      success: true,
      paymentRequestId: result.paymentRequestId,
      transactionHash: result.transactionHash,
      amountUsd: result.amountUsd,
      cryptoRate: result.cryptoRate,
      cryptoAmount: result.cryptoAmount,
      destinationAddress: result.destinationAddress,
      requiresManualSigning: result.requiresManualSigning,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    console.error('Receive payment error:', error);
    return { success: false, error: '給与受領に失敗しました' };
  }
}
