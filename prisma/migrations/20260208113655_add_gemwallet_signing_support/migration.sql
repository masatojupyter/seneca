-- AlterTable
ALTER TABLE "OrganizationWallet" ADD COLUMN     "requiresManualSigning" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "walletSecretEnc" DROP NOT NULL;
