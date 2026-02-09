import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import { decrypt } from '@/lib/server/infra/encryption';
import { getTokenIssuerConfig } from '@/lib/server/infra/token-issuer-config';
import {
  createCanonicalPaymentData,
  hashPaymentData,
} from '@/lib/server/infra/payment-data-hash';
import { getAccountBalance } from '@/lib/server/gateway/xrpl-gateway';
import { validateDestinationAddress } from '@/lib/server/gateway/xrpl-payment-gateway';
import { sendCryptoPayment, getCryptoBalance } from '@/lib/server/gateway/crypto-payment-gateway';
import { validateRlusdTrustline, requiresTrustlineValidation } from '@/lib/server/gateway/trustline-gateway';
import {
  PaymentError,
  InsufficientBalanceError,
} from '@/lib/server/errors';
import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';

export type ExecutePaymentInput = {
  paymentRequestId: string;
  organizationId: string;
  adminId: string;
};

const XRP_RESERVE = 10;

/**
 * 支払いを実行（XRP送金）
 */
export async function executePayment(input: ExecutePaymentInput): Promise<string> {
  const { paymentRequestId, organizationId, adminId } = input;

  // 1. 支払いリクエストが存在し、組織に属しているか確認
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
            include: {
              history: {
                where: { action: 'SET_DEFAULT' },
                orderBy: { changedAt: 'desc' },
                take: 1,
              },
            },
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

  const selectedCryptoType = paymentRequest.cryptoType as CryptoType;

  // 2. トークン発行者設定取得（RLUSD等のトークンの場合は環境変数またはDBから）
  let tokenIssuerConfig: TokenIssuerConfig | undefined;
  if (requiresTrustlineValidation(selectedCryptoType)) {
    tokenIssuerConfig = await getTokenIssuerConfig(selectedCryptoType);
    if (!tokenIssuerConfig) {
      throw new Error(
        `${selectedCryptoType}の発行者設定が見つかりません。環境変数 RLUSD_ISSUER_ADDRESS を設定するか、管理画面から設定してください。`
      );
    }
  }

  // 3. 組織のデフォルトウォレット取得
  const orgWallet = await prisma.organizationWallet.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
  });

  if (!orgWallet) {
    throw new Error('組織のウォレットが設定されていません');
  }

  // GemWalletモード（手動署名が必要）の場合はエラー
  if (orgWallet.requiresManualSigning) {
    throw new Error('このウォレットはGemWalletでの手動署名が必要です。ブラウザ拡張から支払いを実行してください。');
  }

  // 4. CryptoSetting制限チェック
  await validatePaymentLimits(organizationId, Number(paymentRequest.amountUsd), cryptoAddress);

  // 5. 送金先アドレスの検証（XRPLアドレス検証 + RLUSDの場合はトラストライン検証）
  await validateDestinationAddress(cryptoAddress.address);
  const requiredAmount = Number(paymentRequest.cryptoAmount);
  if (requiresTrustlineValidation(selectedCryptoType) && tokenIssuerConfig) {
    await validateRlusdTrustline(
      cryptoAddress.address,
      tokenIssuerConfig.issuerAddress,
      tokenIssuerConfig.currencyCode,
      requiredAmount
    );
  }

  // 6. 残高チェック
  const orgBalance = await getAccountBalance(orgWallet.walletAddress);
  const availableXrp = orgBalance.xrp - XRP_RESERVE;

  if (selectedCryptoType === 'XRP') {
    if (availableXrp < requiredAmount) {
      throw new InsufficientBalanceError(requiredAmount, availableXrp);
    }
  } else if (tokenIssuerConfig) {
    const tokenBalance = await getCryptoBalance(
      orgWallet.walletAddress,
      selectedCryptoType,
      tokenIssuerConfig
    );
    if (tokenBalance < requiredAmount) {
      throw new PaymentError(
        `${selectedCryptoType}残高不足です。必要: ${requiredAmount.toFixed(2)}, 利用可能: ${tokenBalance.toFixed(2)}`
      );
    }
    // トークン送金にもXRP（手数料用）が必要
    if (availableXrp < 1) {
      throw new InsufficientBalanceError(1, availableXrp);
    }
  }

  // 7. データハッシュ生成
  const canonicalData = createCanonicalPaymentData({
    paymentRequestId,
    workerId: paymentRequest.workerId,
    amountUsd: Number(paymentRequest.amountUsd),
    cryptoAmount: requiredAmount,
    cryptoRate: Number(paymentRequest.cryptoRate),
    applicationIds: paymentRequest.applicationIds,
    destinationAddress: cryptoAddress.address,
    timestamp: new Date().toISOString(),
  });
  const dataHash = hashPaymentData(canonicalData);

  // 8. ステータスをPROCESSINGに更新（二重送金防止）
  await prisma.paymentRequest.update({
    where: { id: paymentRequestId },
    data: {
      status: 'PROCESSING',
      dataHash,
      canonicalDataJson: canonicalData,
    },
  });

  // 9. 送金実行（XRP or RLUSD）
  let transactionHash: string;
  try {
    const walletSecret = decrypt(orgWallet.walletSecretEnc!);

    const result = await sendCryptoPayment({
      cryptoType: selectedCryptoType,
      fromSecret: walletSecret,
      toAddress: cryptoAddress.address,
      amount: requiredAmount,
      tokenIssuerConfig,
      memos: [
        {
          memoType: 'seneca/payment',
          memoData: JSON.stringify({
            paymentRequestId,
            dataHash,
          }),
        },
      ],
    });

    transactionHash = result.transactionHash;
  } catch (error: unknown) {
    // 送金失敗: FAILEDに更新
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    const xrplErrorCode = error instanceof PaymentError ? error.xrplErrorCode : undefined;

    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
      },
    });

    await logPaymentRequestStatus({
      paymentRequestId,
      workerId: paymentRequest.workerId,
      action: 'FAILED',
      paymentRequest,
      cryptoAddress: cryptoAddress.address,
      previousStatus: 'PROCESSING',
      newStatus: 'FAILED',
      adminId,
      errorMessage,
    });

    throw new PaymentError(
      `${selectedCryptoType}送金に失敗しました: ${errorMessage}`,
      xrplErrorCode
    );
  }

  // 10. 成功: COMPLETEDに更新
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

  // 11. TimescaleDBにログ記録
  await Promise.all([
    logPaymentTransaction({
      paymentRequestId,
      organizationId,
      workerId: paymentRequest.workerId,
      amountUsd: Number(paymentRequest.amountUsd),
      cryptoType: selectedCryptoType,
      cryptoRate: Number(paymentRequest.cryptoRate),
      cryptoAmount: requiredAmount,
      transactionHash,
    }),
    logPaymentRequestStatus({
      paymentRequestId,
      workerId: paymentRequest.workerId,
      action: 'COMPLETED',
      paymentRequest,
      cryptoAddress: cryptoAddress.address,
      previousStatus: 'PROCESSING',
      newStatus: 'COMPLETED',
      adminId,
      transactionHash,
    }),
    logPaymentHash({
      paymentRequestId,
      dataHash,
      canonicalData,
      transactionHash,
    }),
  ]);

  return transactionHash;
}

/**
 * CryptoSetting制限のバリデーション
 */
async function validatePaymentLimits(
  organizationId: string,
  amountUsd: number,
  cryptoAddress: { history: { changedAt: Date }[] }
): Promise<void> {
  const setting = await prisma.cryptoSetting.findUnique({
    where: { organizationId },
  });

  if (!setting) {
    return;
  }

  // 日次支払い件数制限
  if (setting.dailyPaymentLimit > 0) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await prisma.paymentRequest.count({
      where: {
        worker: { organizationId },
        status: { in: ['COMPLETED', 'PROCESSING'] },
        processedAt: { gte: todayStart },
      },
    });

    if (todayCount >= setting.dailyPaymentLimit) {
      throw new PaymentError('本日の支払い件数上限に達しています');
    }
  }

  // 日次支払い金額制限
  if (setting.dailyAmountLimitUsd) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPayments = await prisma.paymentRequest.findMany({
      where: {
        worker: { organizationId },
        status: { in: ['COMPLETED', 'PROCESSING'] },
        processedAt: { gte: todayStart },
      },
      select: { amountUsd: true },
    });

    const todayTotal = todayPayments.reduce(
      (sum, p) => sum + Number(p.amountUsd),
      0
    );

    if (todayTotal + amountUsd > Number(setting.dailyAmountLimitUsd)) {
      throw new PaymentError(
        `本日の支払い金額上限（${Number(setting.dailyAmountLimitUsd)} USD）を超えます`
      );
    }
  }

  // 新規アドレスロック期間チェック
  if (setting.newAddressLockHours > 0) {
    const lastDefaultChange = cryptoAddress.history[0];
    if (lastDefaultChange) {
      const lockUntil = new Date(lastDefaultChange.changedAt);
      lockUntil.setHours(lockUntil.getHours() + setting.newAddressLockHours);

      if (new Date() < lockUntil) {
        const hoursRemaining = Math.ceil(
          (lockUntil.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        throw new PaymentError(
          `アドレス変更後のロック期間中です（残り約${hoursRemaining}時間）`
        );
      }
    }
  }
}

/**
 * payment_transactions テーブルにログ記録
 */
async function logPaymentTransaction(data: {
  paymentRequestId: string;
  organizationId: string;
  workerId: string;
  amountUsd: number;
  cryptoType: string;
  cryptoRate: number;
  cryptoAmount: number;
  transactionHash: string;
}): Promise<void> {
  await queryTimescale(
    `INSERT INTO payment_transactions (
      payment_request_id, organization_id, worker_id,
      amount_usd, crypto_type, crypto_rate, crypto_amount,
      transaction_hash, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      data.paymentRequestId,
      data.organizationId,
      data.workerId,
      data.amountUsd,
      data.cryptoType,
      data.cryptoRate,
      data.cryptoAmount,
      data.transactionHash,
      'COMPLETED',
    ]
  );
}

/**
 * payment_request_logs テーブルにステータス変更ログを記録
 */
async function logPaymentRequestStatus(data: {
  paymentRequestId: string;
  workerId: string;
  action: string;
  paymentRequest: {
    amountUsd: unknown;
    cryptoType: string;
    cryptoRate: unknown;
    cryptoAmount: unknown;
  };
  cryptoAddress: string;
  previousStatus: string;
  newStatus: string;
  adminId: string;
  transactionHash?: string;
  errorMessage?: string;
}): Promise<void> {
  await queryTimescale(
    `INSERT INTO payment_request_logs (
      payment_request_id, worker_id, action,
      amount_usd, crypto_type, crypto_rate, crypto_amount,
      crypto_address, previous_status, new_status,
      admin_id, transaction_hash, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      data.paymentRequestId,
      data.workerId,
      data.action,
      Number(data.paymentRequest.amountUsd),
      data.paymentRequest.cryptoType,
      Number(data.paymentRequest.cryptoRate),
      Number(data.paymentRequest.cryptoAmount),
      data.cryptoAddress,
      data.previousStatus,
      data.newStatus,
      data.adminId,
      data.transactionHash ?? null,
      data.errorMessage ?? null,
    ]
  );
}

/**
 * payment_hash_logs テーブルにハッシュログを記録
 */
async function logPaymentHash(data: {
  paymentRequestId: string;
  dataHash: string;
  canonicalData: string;
  transactionHash: string;
}): Promise<void> {
  await queryTimescale(
    `INSERT INTO payment_hash_logs (
      payment_request_id, data_hash, canonical_data,
      transaction_hash
    ) VALUES ($1, $2, $3::jsonb, $4)`,
    [
      data.paymentRequestId,
      data.dataHash,
      data.canonicalData,
      data.transactionHash,
    ]
  );
}
