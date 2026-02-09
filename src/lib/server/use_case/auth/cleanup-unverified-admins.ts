import { prisma } from '@/lib/server/infra/prisma';

type CleanupResult = {
  deletedTokens: number;
  deletedAdmins: number;
  deletedOrganizations: number;
};

/**
 * 期限切れの確認トークンと、未確認の管理者ユーザーを削除する
 *
 * このuse caseは定期的に実行されることを想定しています（例: cron job）
 */
export async function cleanupUnverifiedAdmins(): Promise<CleanupResult> {
  const now = new Date();
  let deletedTokens = 0;
  let deletedAdmins = 0;
  let deletedOrganizations = 0;

  // 期限切れのトークンを取得
  const expiredTokens = await prisma.verificationToken.findMany({
    where: {
      expires: { lt: now },
    },
  });

  // 各期限切れトークンに対応する未確認管理者を処理
  for (const token of expiredTokens) {
    const result = await prisma.$transaction(async (tx) => {
      // 未確認の管理者を検索
      const admin = await tx.adminUser.findFirst({
        where: {
          email: token.identifier,
          isActive: false,
          emailVerified: null,
        },
      });

      // トークンを削除
      await tx.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: token.identifier,
            token: token.token,
          },
        },
      });

      if (admin) {
        const organizationId = admin.organizationId;

        // 管理者を削除
        await tx.adminUser.delete({
          where: { id: admin.id },
        });

        // 組織に他の管理者がいなければ組織も削除
        const remainingAdmins = await tx.adminUser.findFirst({
          where: { organizationId },
        });

        if (!remainingAdmins) {
          // 組織に関連するworkerも削除
          await tx.workerUser.deleteMany({
            where: { organizationId },
          });

          await tx.organization.delete({
            where: { id: organizationId },
          });

          return { deletedAdmin: true, deletedOrg: true };
        }

        return { deletedAdmin: true, deletedOrg: false };
      }

      return { deletedAdmin: false, deletedOrg: false };
    });

    deletedTokens++;
    if (result.deletedAdmin) deletedAdmins++;
    if (result.deletedOrg) deletedOrganizations++;
  }

  console.log(`Cleanup completed: ${deletedTokens} tokens, ${deletedAdmins} admins, ${deletedOrganizations} organizations deleted`);

  return {
    deletedTokens,
    deletedAdmins,
    deletedOrganizations,
  };
}
