import { prisma } from '@/lib/server/infra/prisma';
import { ValidationError } from '@/lib/server/errors';

type VerifyAdminEmailInput = {
  token: string;
};

type VerifyAdminEmailOutput = {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
};

/**
 * 管理者のメールアドレスを確認し、アカウントをアクティブ化する
 */
export async function verifyAdminEmail(
  input: VerifyAdminEmailInput
): Promise<VerifyAdminEmailOutput> {
  const { token } = input;

  if (!token) {
    throw new ValidationError('確認トークンが指定されていません');
  }

  // トークンを検索
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new ValidationError('無効な確認リンクです。再度登録を行ってください。');
  }

  // 有効期限をチェック
  if (new Date() > verificationToken.expires) {
    // 期限切れトークンを削除
    await prisma.verificationToken.delete({
      where: { token },
    });
    throw new ValidationError(
      '確認リンクの有効期限が切れています。再度登録を行ってください。'
    );
  }

  // 対応する管理者を検索
  const adminUser = await prisma.adminUser.findFirst({
    where: {
      email: verificationToken.identifier,
      isActive: false,
      emailVerified: null,
    },
  });

  if (!adminUser) {
    // トークンを削除
    await prisma.verificationToken.delete({
      where: { token },
    });
    throw new ValidationError(
      'アカウントが見つかりません。既に確認済みか、削除された可能性があります。'
    );
  }

  // トランザクションで管理者をアクティブ化し、トークンを削除
  const result = await prisma.$transaction(async (tx) => {
    // 管理者をアクティブ化
    const updatedAdmin = await tx.adminUser.update({
      where: { id: adminUser.id },
      data: {
        isActive: true,
        emailVerified: new Date(),
      },
    });

    // トークンを削除
    await tx.verificationToken.delete({
      where: { token },
    });

    return updatedAdmin;
  });

  return {
    userId: result.id,
    email: result.email,
    name: result.name,
    organizationId: result.organizationId,
  };
}
