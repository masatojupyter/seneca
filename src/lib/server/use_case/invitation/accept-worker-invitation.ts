import { prisma } from '@/lib/server/infra/prisma';
import bcrypt from 'bcryptjs';
import { NotFoundError, ValidationError } from '@/lib/server/errors';

type AcceptWorkerInvitationInput = {
  token: string;
  password: string;
  name: string;
};

type AcceptWorkerInvitationOutput = {
  workerId: string;
  organizationId: string;
};

const PASSWORD_HASH_ROUNDS = 12;

export async function acceptWorkerInvitation(input: AcceptWorkerInvitationInput): Promise<AcceptWorkerInvitationOutput> {
  const { token, password, name } = input;

  // パスワードの強度チェック
  if (password.length < 8) {
    throw new ValidationError('パスワードは8文字以上で入力してください');
  }

  // 招待を取得
  const invitation = await prisma.workerInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    throw new NotFoundError('招待が見つかりません');
  }

  // 既に受諾済みかチェック
  if (invitation.acceptedAt) {
    throw new ValidationError('この招待は既に使用されています');
  }

  // 有効期限をチェック
  if (invitation.expiresAt < new Date()) {
    throw new ValidationError('この招待は期限切れです');
  }

  // 既存の従業員をチェック
  const existingWorker = await prisma.workerUser.findUnique({
    where: {
      email_organizationId: {
        email: invitation.email,
        organizationId: invitation.organizationId,
      },
    },
  });

  if (existingWorker) {
    throw new ValidationError('このメールアドレスは既に登録されています');
  }

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  // トランザクションで従業員作成と招待更新
  const result = await prisma.$transaction(async (tx) => {
    // 従業員を作成
    const worker = await tx.workerUser.create({
      data: {
        email: invitation.email,
        passwordHash,
        name,
        hourlyRateUsd: invitation.hourlyRateUsd,
        organizationId: invitation.organizationId,
        isActive: true,
        emailVerified: new Date(), // 招待経由なのでメール確認済みとする
      },
    });

    // 招待を受諾済みにマーク
    await tx.workerInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return {
      workerId: worker.id,
      organizationId: worker.organizationId,
    };
  });

  return result;
}
