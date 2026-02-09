import { prisma } from '@/lib/server/infra/prisma';
import { queryTimescale } from '@/lib/server/infra/timescale';
import { decrypt } from '@/lib/server/infra/encryption';
import { getTokenIssuerConfig } from '@/lib/server/infra/token-issuer-config';
import { getCryptoUsdRate } from '@/lib/server/gateway/exchange-rate-gateway';
import { getAccountBalance } from '@/lib/server/gateway/xrpl-gateway';
import { validateDestinationAddress } from '@/lib/server/gateway/xrpl-payment-gateway';
import { sendCryptoPayment, getCryptoBalance } from '@/lib/server/gateway/crypto-payment-gateway';
import { validateRlusdTrustline, requiresTrustlineValidation } from '@/lib/server/gateway/trustline-gateway';
import {
  createCanonicalPaymentData,
  hashPaymentData,
} from '@/lib/server/infra/payment-data-hash';
import {
  PaymentError,
  InsufficientBalanceError,
} from '@/lib/server/errors';
import type { TimeApplication } from '@/lib/server/repository/time-application-repository';
import type { CryptoType, TokenIssuerConfig } from '@/lib/shared/entity';

type ReceivePaymentInput = {
  workerId: string;
  organizationId: string;
  applicationIds: string[];
  cryptoType?: CryptoType;
};

type ReceivePaymentResult = {
  paymentRequestId: string;
  transactionHash: string | null; // GemWalletモードではnull
  amountUsd: number;
  cryptoRate: number;
  cryptoAmount: number;
  destinationAddress: string;
  requiresManualSigning: boolean; // GemWalletでの手動署名が必要か
};

const XRP_RESERVE = 10;

/**
 * 従業員が承認済み申請のXRP受領を実行
 * PaymentRequest作成 → XRP送金を1ステップで実行
 */
export async function receivePayment(
  input: ReceivePaymentInput
): Promise<ReceivePaymentResult> {
  const { workerId, organizationId, applicationIds } = input;

  // 1. 承認済み申請を取得・検証
  const applications = await queryTimescale<TimeApplication>(
    `SELECT
      id,
      worker_id as "workerId",
      organization_id as "organizationId",
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

  const alreadyRequested = applications.filter(
    (app) => app.paymentRequestId !== null
  );
  if (alreadyRequested.length > 0) {
    throw new Error('既に受領済みの申請が含まれています');
  }

  // 2. 従業員のデフォルトアドレス取得
  const cryptoAddress = await prisma.cryptoAddress.findFirst({
    where: { workerId, isDefault: true, isActive: true },
    include: {
      history: {
        where: { action: 'SET_DEFAULT' },
        orderBy: { changedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!cryptoAddress) {
    throw new Error(
      '受取アドレスが設定されていません。ウォレット設定からアドレスを登録してください。'
    );
  }

  // 通貨タイプ決定（入力 > アドレスのcryptoType > XRP）
  const selectedCryptoType = input.cryptoType ?? cryptoAddress.cryptoType ?? 'XRP';

  // 3. トークン発行者設定取得（RLUSD等のトークンの場合は環境変数またはDBから）
  let tokenIssuerConfig: TokenIssuerConfig | undefined;
  if (requiresTrustlineValidation(selectedCryptoType)) {
    tokenIssuerConfig = await getTokenIssuerConfig(selectedCryptoType);
    if (!tokenIssuerConfig) {
      throw new Error(
        `${selectedCryptoType}の発行者設定が見つかりません。環境変数 RLUSD_ISSUER_ADDRESS を設定するか、管理画面から設定してください。`
      );
    }
  }

  // 4. 組織のデフォルトウォレット取得
  const orgWallet = await prisma.organizationWallet.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
  });

  if (!orgWallet) {
    throw new Error('組織のウォレットが設定されていません。管理者に連絡してください。');
  }

  // 5. 合計金額・為替レート算出
  const amountUsd = applications.reduce(
    (sum, app) => sum + Number(app.totalAmountUsd),
    0
  );

  const cryptoRate = await getCryptoUsdRate(selectedCryptoType);
  if (cryptoRate <= 0) {
    throw new Error(
      '為替レートの取得に失敗しました。しばらくしてから再度お試しください。'
    );
  }

  const cryptoAmount = amountUsd / cryptoRate;

  // 6. CryptoSetting 制限チェック
  await validatePaymentLimits(organizationId, amountUsd, cryptoAddress);

  // 7. 送金先アドレスの基本検証（XRPLアドレス形式）
  await validateDestinationAddress(cryptoAddress.address);

  // 8. 組織ウォレット残高チェック
  const orgBalance = await getAccountBalance(orgWallet.walletAddress);
  const availableXrp = orgBalance.xrp - XRP_RESERVE;

  // XRPの場合はXRP残高、RLUSDの場合はRLUSD残高をチェック
  if (selectedCryptoType === 'XRP') {
    if (availableXrp < cryptoAmount) {
      throw new InsufficientBalanceError(cryptoAmount, availableXrp);
    }
  } else if (tokenIssuerConfig) {
    const tokenBalance = await getCryptoBalance(
      orgWallet.walletAddress,
      selectedCryptoType,
      tokenIssuerConfig
    );
    if (tokenBalance < cryptoAmount) {
      throw new PaymentError(
        `${selectedCryptoType}残高不足です。必要: ${cryptoAmount.toFixed(2)}, 利用可能: ${tokenBalance.toFixed(2)}`
      );
    }
    // トークン送金にもXRP（手数料用）が必要
    if (availableXrp < 1) {
      throw new InsufficientBalanceError(1, availableXrp);
    }
  }

  // 9. 為替レート履歴記録
  await queryTimescale(
    `INSERT INTO exchange_rate_history (source, crypto, fiat, rate)
     VALUES ($1, $2, $3, $4)`,
    [selectedCryptoType === 'RLUSD' ? 'fixed' : 'coingecko', selectedCryptoType, 'USD', cryptoRate]
  );

  // GemWalletモード（手動署名が必要な場合）
  if (orgWallet.requiresManualSigning) {
    // PaymentRequest を PENDING で作成（管理者の承認待ち）
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        workerId,
        applicationIds,
        amountUsd,
        cryptoType: selectedCryptoType,
        cryptoRate,
        cryptoAmount,
        withdrawalType: 'ADMIN_APPROVED',
        status: 'PENDING',
      },
    });

    // TimescaleDB の申請ステータス更新
    await queryTimescale(
      `UPDATE time_applications
      SET status = 'REQUESTED', payment_request_id = $1, updated_at = NOW()
      WHERE id = ANY($2)`,
      [paymentRequest.id, applicationIds]
    );

    // データハッシュ生成
    const canonicalData = createCanonicalPaymentData({
      paymentRequestId: paymentRequest.id,
      workerId,
      amountUsd,
      cryptoAmount,
      cryptoRate,
      applicationIds,
      destinationAddress: cryptoAddress.address,
      timestamp: new Date().toISOString(),
    });
    const dataHash = hashPaymentData(canonicalData);

    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: { dataHash, canonicalDataJson: canonicalData },
    });

    // ログ記録
    await logPaymentRequestEvent({
      paymentRequestId: paymentRequest.id,
      workerId,
      action: 'CREATED',
      amountUsd,
      cryptoType: selectedCryptoType,
      cryptoRate,
      cryptoAmount,
      cryptoAddress: cryptoAddress.address,
      previousStatus: 'NONE',
      newStatus: 'PENDING',
    });

    return {
      paymentRequestId: paymentRequest.id,
      transactionHash: null,
      amountUsd,
      cryptoRate,
      cryptoAmount,
      destinationAddress: cryptoAddress.address,
      requiresManualSigning: true,
    };
  }

  // ホットウォレットモード（自動送金）
  // トラストライン検証（ホットウォレットモードでは即時送金するため事前に検証）
  if (requiresTrustlineValidation(selectedCryptoType) && tokenIssuerConfig) {
    await validateRlusdTrustline(
      cryptoAddress.address,
      tokenIssuerConfig.issuerAddress,
      tokenIssuerConfig.currencyCode,
      cryptoAmount
    );
  }

  // 10. PaymentRequest 作成（PROCESSING で開始：即時送金のため）
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      workerId,
      applicationIds,
      amountUsd,
      cryptoType: selectedCryptoType,
      cryptoRate,
      cryptoAmount,
      withdrawalType: 'MANUAL',
      status: 'PROCESSING',
    },
  });

  // 10. TimescaleDB の申請ステータス更新
  await queryTimescale(
    `UPDATE time_applications
    SET status = 'REQUESTED', payment_request_id = $1, updated_at = NOW()
    WHERE id = ANY($2)`,
    [paymentRequest.id, applicationIds]
  );

  // 11. データハッシュ生成
  const canonicalData = createCanonicalPaymentData({
    paymentRequestId: paymentRequest.id,
    workerId,
    amountUsd,
    cryptoAmount,
    cryptoRate,
    applicationIds,
    destinationAddress: cryptoAddress.address,
    timestamp: new Date().toISOString(),
  });
  const dataHash = hashPaymentData(canonicalData);

  await prisma.paymentRequest.update({
    where: { id: paymentRequest.id },
    data: { dataHash, canonicalDataJson: canonicalData },
  });

  // 13. 送金実行（XRP or RLUSD）
  let transactionHash: string;
  try {
    const walletSecret = decrypt(orgWallet.walletSecretEnc!);

    const result = await sendCryptoPayment({
      cryptoType: selectedCryptoType,
      fromSecret: walletSecret,
      toAddress: cryptoAddress.address,
      amount: cryptoAmount,
      tokenIssuerConfig,
      memos: [
        {
          memoType: 'seneca/payment',
          memoData: JSON.stringify({
            paymentRequestId: paymentRequest.id,
            dataHash,
          }),
        },
      ],
    });

    transactionHash = result.transactionHash;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : '不明なエラー';
    const xrplErrorCode =
      error instanceof PaymentError ? error.xrplErrorCode : undefined;

    await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: { status: 'FAILED', processedAt: new Date() },
    });

    await queryTimescale(
      `UPDATE time_applications
      SET status = 'APPROVED', payment_request_id = NULL, updated_at = NOW()
      WHERE id = ANY($1)`,
      [applicationIds]
    );

    await logPaymentRequestEvent({
      paymentRequestId: paymentRequest.id,
      workerId,
      action: 'FAILED',
      amountUsd,
      cryptoType: selectedCryptoType,
      cryptoRate,
      cryptoAmount,
      cryptoAddress: cryptoAddress.address,
      previousStatus: 'PROCESSING',
      newStatus: 'FAILED',
      errorMessage,
    });

    throw new PaymentError(
      `${selectedCryptoType}送金に失敗しました: ${errorMessage}`,
      xrplErrorCode
    );
  }

  // 13. 成功: COMPLETED に更新
  await prisma.paymentRequest.update({
    where: { id: paymentRequest.id },
    data: {
      status: 'COMPLETED',
      transactionHash,
      processedAt: new Date(),
    },
  });

  // 14. 申請ステータスを PAID に更新
  await queryTimescale(
    `UPDATE time_applications
    SET status = 'PAID', updated_at = NOW()
    WHERE id = ANY($1)`,
    [applicationIds]
  );

  // 16. TimescaleDB ログ記録
  await Promise.all([
    queryTimescale(
      `INSERT INTO payment_transactions (
        payment_request_id, organization_id, worker_id,
        amount_usd, crypto_type, crypto_rate, crypto_amount,
        transaction_hash, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        paymentRequest.id,
        organizationId,
        workerId,
        amountUsd,
        selectedCryptoType,
        cryptoRate,
        cryptoAmount,
        transactionHash,
        'COMPLETED',
      ]
    ),
    logPaymentRequestEvent({
      paymentRequestId: paymentRequest.id,
      workerId,
      action: 'COMPLETED',
      amountUsd,
      cryptoType: selectedCryptoType,
      cryptoRate,
      cryptoAmount,
      cryptoAddress: cryptoAddress.address,
      previousStatus: 'PROCESSING',
      newStatus: 'COMPLETED',
      transactionHash,
    }),
    queryTimescale(
      `INSERT INTO payment_hash_logs (
        payment_request_id, data_hash, canonical_data, transaction_hash
      ) VALUES ($1, $2, $3::jsonb, $4)`,
      [paymentRequest.id, dataHash, canonicalData, transactionHash]
    ),
  ]);

  return {
    paymentRequestId: paymentRequest.id,
    transactionHash,
    amountUsd,
    cryptoRate,
    cryptoAmount,
    destinationAddress: cryptoAddress.address,
    requiresManualSigning: false,
  };
}

/**
 * CryptoSetting 制限のバリデーション
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
 * payment_request_logs にイベント記録
 */
async function logPaymentRequestEvent(data: {
  paymentRequestId: string;
  workerId: string;
  action: string;
  amountUsd: number;
  cryptoType: CryptoType;
  cryptoRate: number;
  cryptoAmount: number;
  cryptoAddress: string;
  previousStatus: string;
  newStatus: string;
  transactionHash?: string;
  errorMessage?: string;
}): Promise<void> {
  await queryTimescale(
    `INSERT INTO payment_request_logs (
      payment_request_id, worker_id, action,
      amount_usd, crypto_type, crypto_rate, crypto_amount,
      crypto_address, previous_status, new_status,
      transaction_hash, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      data.paymentRequestId,
      data.workerId,
      data.action,
      data.amountUsd,
      data.cryptoType,
      data.cryptoRate,
      data.cryptoAmount,
      data.cryptoAddress,
      data.previousStatus,
      data.newStatus,
      data.transactionHash ?? null,
      data.errorMessage ?? null,
    ]
  );
}
