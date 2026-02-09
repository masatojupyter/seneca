'use server';

import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getOrganizationPaymentRequests } from '@/lib/server/use_case/admin/get-organization-payment-requests';
import { getPaymentRequestDetail } from '@/lib/server/use_case/admin/get-payment-request-detail';
import { executePayment } from '@/lib/server/use_case/admin/execute-payment';
import { completeGemWalletPayment } from '@/lib/server/use_case/admin/complete-gemwallet-payment';

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
  processedAt: string | null;
  createdAt: string;
};

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
    startDate: string;
    endDate: string;
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
  processedAt: string | null;
  createdAt: string;
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

export type GetPaymentRequestsResult = {
  success: boolean;
  error?: string;
  paymentRequests?: PaymentRequestListItem[];
};

export type GetPaymentRequestDetailResult = {
  success: boolean;
  error?: string;
  paymentRequest?: PaymentRequestDetail;
};

export type ExecutePaymentResult = {
  success: boolean;
  error?: string;
  transactionHash?: string;
};

/**
 * 支払いリクエスト一覧を取得
 */
export async function getPaymentRequestsAction(
  status?: string
): Promise<GetPaymentRequestsResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const paymentRequests = await getOrganizationPaymentRequests(
      session.user.organizationId,
      status
    );

    return {
      success: true,
      paymentRequests: paymentRequests.map((req) => ({
        ...req,
        processedAt: req.processedAt?.toISOString() || null,
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
      error: '支払いリクエスト一覧の取得に失敗しました',
    };
  }
}

/**
 * 支払いリクエスト詳細を取得
 */
export async function getPaymentRequestDetailAction(
  paymentRequestId: string
): Promise<GetPaymentRequestDetailResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const paymentRequest = await getPaymentRequestDetail(
      paymentRequestId,
      session.user.organizationId
    );

    if (!paymentRequest) {
      return {
        success: false,
        error: '支払いリクエストが見つかりません',
      };
    }

    return {
      success: true,
      paymentRequest: {
        ...paymentRequest,
        applications: paymentRequest.applications.map((app) => ({
          ...app,
          startDate: app.startDate.toISOString(),
          endDate: app.endDate.toISOString(),
        })),
        processedAt: paymentRequest.processedAt?.toISOString() || null,
        createdAt: paymentRequest.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get payment request detail error:', error);
    return {
      success: false,
      error: '支払いリクエスト詳細の取得に失敗しました',
    };
  }
}

/**
 * 支払いを実行
 */
export async function executePaymentAction(
  paymentRequestId: string
): Promise<ExecutePaymentResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const transactionHash = await executePayment({
      paymentRequestId,
      organizationId: session.user.organizationId,
      adminId: session.user.id,
    });

    return {
      success: true,
      transactionHash,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Execute payment error:', error);
    return {
      success: false,
      error: '支払いの実行に失敗しました',
    };
  }
}

export type CompleteGemWalletPaymentInput = {
  paymentRequestId: string;
  transactionHash: string;
};

/**
 * GemWalletで署名した支払いを完了
 */
export async function completeGemWalletPaymentAction(
  input: CompleteGemWalletPaymentInput
): Promise<ExecutePaymentResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    await completeGemWalletPayment({
      paymentRequestId: input.paymentRequestId,
      transactionHash: input.transactionHash,
      organizationId: session.user.organizationId,
      adminId: session.user.id,
    });

    return {
      success: true,
      transactionHash: input.transactionHash,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Complete GemWallet payment error:', error);
    return {
      success: false,
      error: '支払いの完了処理に失敗しました',
    };
  }
}
