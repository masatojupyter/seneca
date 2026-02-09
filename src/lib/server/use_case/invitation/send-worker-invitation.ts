import { prisma } from '@/lib/server/infra/prisma';
import { NotFoundError, ValidationError } from '@/lib/server/errors';

type SendWorkerInvitationInput = {
  email: string;
  hourlyRateUsd: number;
  organizationId: string;
  adminId: string;
};

type SendWorkerInvitationOutput = {
  invitationId: string;
  token: string;
};

export async function sendWorkerInvitation(input: SendWorkerInvitationInput): Promise<SendWorkerInvitationOutput> {
  const { email, hourlyRateUsd, organizationId, adminId } = input;

  // 時給のバリデーション
  if (hourlyRateUsd <= 0) {
    throw new ValidationError('時給は0より大きい値を入力してください');
  }

  // 組織の存在確認
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new NotFoundError('組織が見つかりません');
  }

  // 管理者の権限確認
  const admin = await prisma.adminUser.findFirst({
    where: {
      id: adminId,
      organizationId,
      isActive: true,
    },
  });

  if (!admin) {
    throw new NotFoundError('管理者が見つかりません');
  }

  // 既存の招待をチェック（有効期限内）
  const existingInvitation = await prisma.workerInvitation.findFirst({
    where: {
      email,
      organizationId,
      expiresAt: {
        gt: new Date(),
      },
      acceptedAt: null,
    },
  });

  if (existingInvitation) {
    throw new ValidationError('この従業員には既に有効な招待が存在します');
  }

  // 招待トークンを生成
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7日間有効

  // 招待を作成
  const invitation = await prisma.workerInvitation.create({
    data: {
      email,
      token,
      hourlyRateUsd,
      organizationId,
      expiresAt,
    },
  });

  // TODO: 本番環境ではメール送信を実装する
  // - src/lib/server/gateway/email-gateway.ts を作成
  // - src/lib/server/infra/nodemailer.ts でNodemailerを使用した実装
  // - 環境変数 NODE_ENV で本番/開発を判定
  if (process.env.NODE_ENV === 'production') {
    // TODO: メール送信処理を呼び出す
    // await emailGateway.sendWorkerInvitationEmail(email, token, organization.name);
  } else {
    // 開発環境: コンソールに招待トークンを表示
    console.log('\n========================================');
    console.log('従業員招待送信完了');
    console.log('========================================');
    console.log('Email:', email);
    console.log('Organization:', organization.name);
    console.log('Hourly Rate (USD):', hourlyRateUsd);
    console.log('Invitation Token:', token);
    console.log('Invitation URL:', `${process.env.AUTH_URL || 'http://localhost:3000'}/invite/worker/${token}`);
    console.log('有効期限: 7日間');
    console.log('========================================\n');
  }

  return {
    invitationId: invitation.id,
    token,
  };
}
