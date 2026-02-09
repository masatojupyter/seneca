-- CreateEnum
CREATE TYPE "AddressAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'ACTIVATED', 'DEACTIVATED', 'SET_DEFAULT');

-- CreateEnum
CREATE TYPE "CryptoType" AS ENUM ('XRP', 'RLUSD');

-- CreateEnum
CREATE TYPE "WithdrawalType" AS ENUM ('AUTO', 'MANUAL', 'ADMIN_APPROVED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'WORKER');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('SINGLE', 'BATCH', 'PERIOD');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REQUESTED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "RejectionCategory" AS ENUM ('TIME_ERROR', 'MISSING_REST', 'DUPLICATE', 'POLICY_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('IMMEDIATE', 'DAILY');

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "hourlyRateUsd" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoAddress" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "cryptoType" "CryptoType" NOT NULL DEFAULT 'XRP',
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasTrustline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoAddressHistory" (
    "id" TEXT NOT NULL,
    "cryptoAddressId" TEXT NOT NULL,
    "action" "AddressAction" NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoAddressHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "autoPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxAutoPaymentUsd" DECIMAL(12,2) NOT NULL,
    "dailyPaymentLimit" INTEGER NOT NULL DEFAULT 10,
    "dailyAmountLimitUsd" DECIMAL(12,2),
    "newAddressLockHours" INTEGER NOT NULL DEFAULT 0,
    "require2FA" BOOLEAN NOT NULL DEFAULT false,
    "defaultPaymentCrypto" "CryptoType" NOT NULL DEFAULT 'XRP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CryptoSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationWallet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cryptoType" "CryptoType" NOT NULL DEFAULT 'XRP',
    "walletAddress" TEXT NOT NULL,
    "walletSecretEnc" TEXT NOT NULL,
    "label" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenIssuerConfig" (
    "id" TEXT NOT NULL,
    "cryptoType" "CryptoType" NOT NULL,
    "issuerAddress" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'mainnet',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenIssuerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "hourlyRateUsd" DECIMAL(10,2) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "applicationIds" TEXT[],
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "cryptoType" "CryptoType" NOT NULL DEFAULT 'XRP',
    "cryptoRate" DECIMAL(18,6) NOT NULL,
    "cryptoAmount" DECIMAL(18,6) NOT NULL,
    "withdrawalType" "WithdrawalType" NOT NULL DEFAULT 'MANUAL',
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "dataHash" TEXT,
    "canonicalDataJson" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionHash" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "applicationNotify" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotify" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'IMMEDIATE',

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "AdminUser_organizationId_idx" ON "AdminUser"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_organizationId_key" ON "AdminUser"("email", "organizationId");

-- CreateIndex
CREATE INDEX "WorkerUser_organizationId_idx" ON "WorkerUser"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerUser_email_organizationId_key" ON "WorkerUser"("email", "organizationId");

-- CreateIndex
CREATE INDEX "CryptoAddress_workerId_idx" ON "CryptoAddress"("workerId");

-- CreateIndex
CREATE INDEX "CryptoAddress_isDefault_idx" ON "CryptoAddress"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoAddress_workerId_address_cryptoType_key" ON "CryptoAddress"("workerId", "address", "cryptoType");

-- CreateIndex
CREATE INDEX "CryptoAddressHistory_cryptoAddressId_idx" ON "CryptoAddressHistory"("cryptoAddressId");

-- CreateIndex
CREATE INDEX "CryptoAddressHistory_changedAt_idx" ON "CryptoAddressHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoSetting_organizationId_key" ON "CryptoSetting"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationWallet_organizationId_idx" ON "OrganizationWallet"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationWallet_isDefault_idx" ON "OrganizationWallet"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationWallet_organizationId_walletAddress_cryptoType_key" ON "OrganizationWallet"("organizationId", "walletAddress", "cryptoType");

-- CreateIndex
CREATE UNIQUE INDEX "TokenIssuerConfig_cryptoType_key" ON "TokenIssuerConfig"("cryptoType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerInvitation_token_key" ON "WorkerInvitation"("token");

-- CreateIndex
CREATE INDEX "WorkerInvitation_organizationId_idx" ON "WorkerInvitation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_token_key" ON "AdminInvitation"("token");

-- CreateIndex
CREATE INDEX "AdminInvitation_organizationId_idx" ON "AdminInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentRequest_workerId_idx" ON "PaymentRequest"("workerId");

-- CreateIndex
CREATE INDEX "PaymentRequest_status_idx" ON "PaymentRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_userType_key" ON "NotificationSetting"("userId", "userType");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerUser" ADD CONSTRAINT "WorkerUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoAddress" ADD CONSTRAINT "CryptoAddress_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoAddressHistory" ADD CONSTRAINT "CryptoAddressHistory_cryptoAddressId_fkey" FOREIGN KEY ("cryptoAddressId") REFERENCES "CryptoAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoSetting" ADD CONSTRAINT "CryptoSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationWallet" ADD CONSTRAINT "OrganizationWallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerInvitation" ADD CONSTRAINT "WorkerInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
