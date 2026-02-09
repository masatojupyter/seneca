// ========================================
// ユーザータイプ
// ========================================
export type UserType = 'ADMIN' | 'WORKER';

// 管理者ユーザー
export type AdminUser = {
  id: string;
  email: string;
  emailVerified: Date | null;
  passwordHash: string;
  name: string;
  image: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

// 従業員ユーザー
export type WorkerUser = {
  id: string;
  email: string;
  emailVerified: Date | null;
  passwordHash: string;
  name: string;
  image: string | null;
  hourlyRateUsd: number;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

// 暗号資産アドレス
export type AddressAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'ACTIVATED' | 'DEACTIVATED' | 'SET_DEFAULT';

export type CryptoAddress = {
  id: string;
  workerId: string;
  cryptoType: CryptoType;
  address: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  hasTrustline: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CryptoAddressHistory = {
  id: string;
  cryptoAddressId: string;
  action: AddressAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedAt: Date;
};

// ========================================
// 組織
// ========================================
export type Organization = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// 招待
// ========================================
export type WorkerInvitation = {
  id: string;
  email: string;
  token: string;
  hourlyRateUsd: number;
  organizationId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export type AdminInvitation = {
  id: string;
  email: string;
  token: string;
  organizationId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

// ========================================
// 暗号資産設定
// ========================================
export type CryptoType = 'XRP' | 'RLUSD';

export type CryptoSetting = {
  id: string;
  organizationId: string;
  autoPaymentEnabled: boolean;
  maxAutoPaymentUsd: number;
  dailyPaymentLimit: number;
  dailyAmountLimitUsd: number | null;
  newAddressLockHours: number;
  require2FA: boolean;
  defaultPaymentCrypto: CryptoType;
  createdAt: Date;
  updatedAt: Date;
};

// トークン発行者設定
export type TokenIssuerConfig = {
  id: string;
  cryptoType: CryptoType;
  issuerAddress: string;
  currencyCode: string;
  network: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationWallet = {
  id: string;
  organizationId: string;
  cryptoType: CryptoType;
  walletAddress: string;
  walletSecretEnc: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// 時間申請
// ========================================
export type ApplicationType = 'SINGLE' | 'BATCH' | 'PERIOD';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REQUESTED' | 'PAID' | 'REJECTED';
export type RejectionCategory = 'TIME_ERROR' | 'MISSING_REST' | 'DUPLICATE' | 'POLICY_VIOLATION' | 'OTHER';

export type TimeApplication = {
  id: string;
  workerId: string;
  type: ApplicationType;
  startDate: Date;
  endDate: Date;
  totalMinutes: number;
  totalAmountUsd: number;
  status: ApplicationStatus;
  memo: string | null;
  rejectionReason: string | null;
  timestampIds: string[];
  sessionIds: string[];

  // 承認関連
  approvedAt: Date | null;
  approvedBy: string | null;
  approvedAmountUsd: number | null;
  hourlyRateAtApproval: number | null;

  // 却下関連
  rejectionCategory: RejectionCategory | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;

  // 再申請関連
  originalApplicationId: string | null;
  resubmitCount: number;

  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// 給与受領
// ========================================
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type WithdrawalType = 'AUTO' | 'MANUAL' | 'ADMIN_APPROVED';

export type PaymentRequest = {
  id: string;
  workerId: string;
  applicationIds: string[];
  amountUsd: number;
  cryptoType: CryptoType;
  cryptoRate: number;
  cryptoAmount: number;
  withdrawalType: WithdrawalType;
  autoApproved: boolean;
  dataHash: string | null;
  canonicalDataJson: string | null;
  status: PaymentStatus;
  transactionHash: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

// ========================================
// 打刻（TimescaleDB）
// ========================================
export type WorkTimestampStatus = 'WORK' | 'REST' | 'END';
export type WorkTimestampApplicationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REQUESTED' | 'PAID';

export type WorkTimestamp = {
  id: string;
  workerId: string;
  status: WorkTimestampStatus;
  timestamp: Date;
  memo: string | null;
  applicationStatus: WorkTimestampApplicationStatus;
  createdAt: Date;
};

// ========================================
// 為替レート（TimescaleDB）
// ========================================
export type ExchangeRate = {
  id: string;
  source: string;
  crypto: CryptoType;
  fiat: string;
  rate: number;
  recordedAt: Date;
};

// ========================================
// 通知設定
// ========================================
export type DigestFrequency = 'IMMEDIATE' | 'DAILY';

export type NotificationSetting = {
  id: string;
  userId: string;
  userType: UserType;
  emailEnabled: boolean;
  applicationNotify: boolean;
  paymentNotify: boolean;
  digestFrequency: DigestFrequency;
};
