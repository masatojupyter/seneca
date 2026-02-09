import { prisma } from '@/lib/server/infra/prisma';
import bcrypt from 'bcryptjs';
import { ConflictError, ValidationError } from '@/lib/server/errors';
import { sendAdminVerificationEmail } from '@/lib/server/gateway/email-gateway';
import { getEmailGateway } from '@/lib/server/infra/nodemailer';

type RegisterAdminInput = {
  email: string;
  password: string;
  name: string;
  organizationName: string;
};

type RegisterAdminOutput = {
  userId: string;
  organizationId: string;
  verificationToken: string;
};

const PASSWORD_HASH_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 30;

export async function registerAdmin(input: RegisterAdminInput): Promise<RegisterAdminOutput> {
  const { email, password, name, organizationName } = input;

  // パスワードの強度チェック
  if (password.length < 8) {
    throw new ValidationError('パスワードは8文字以上で入力してください');
  }

  // 既存のアクティブな管理者をチェック
  const existingActiveAdmin = await prisma.adminUser.findFirst({
    where: {
      email,
      isActive: true,
    },
  });

  if (existingActiveAdmin) {
    throw new ConflictError('このメールアドレスは既に登録されています');
  }

  // 既存の未確認の管理者と関連データを削除
  const existingInactiveAdmin = await prisma.adminUser.findFirst({
    where: {
      email,
      isActive: false,
      emailVerified: null,
    },
  });

  if (existingInactiveAdmin) {
    await prisma.$transaction(async (tx) => {
      // 関連するトークンを削除
      await tx.verificationToken.deleteMany({
        where: { identifier: email },
      });
      // 未確認の管理者を削除
      await tx.adminUser.delete({
        where: { id: existingInactiveAdmin.id },
      });
      // 組織に他の管理者がいなければ組織も削除
      const otherAdmins = await tx.adminUser.findFirst({
        where: { organizationId: existingInactiveAdmin.organizationId },
      });
      if (!otherAdmins) {
        await tx.organization.delete({
          where: { id: existingInactiveAdmin.organizationId },
        });
      }
    });
  }

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  // トランザクションで組織と管理者を作成
  console.log('[RegisterAdmin] Starting transaction to create user and organization...');
  const result = await prisma.$transaction(async (tx) => {
    // 組織を作成
    console.log('[RegisterAdmin] Creating organization:', organizationName);
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
      },
    });
    console.log('[RegisterAdmin] Organization created. ID:', organization.id);

    // 管理者を作成（isActive: false で作成、メール確認後にアクティブ化）
    console.log('[RegisterAdmin] Creating admin user:', email);
    const adminUser = await tx.adminUser.create({
      data: {
        email,
        passwordHash,
        name,
        organizationId: organization.id,
        isActive: false,
      },
    });
    console.log('[RegisterAdmin] Admin user created. ID:', adminUser.id);

    // メール確認トークンを生成（30分有効）
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TOKEN_EXPIRY_MINUTES);

    console.log('[RegisterAdmin] Creating verification token...');
    await tx.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expiresAt,
      },
    });
    console.log('[RegisterAdmin] Verification token created.');

    return {
      userId: adminUser.id,
      organizationId: organization.id,
      verificationToken,
    };
  });
  console.log('[RegisterAdmin] Transaction completed successfully.');

  // 確認メールを送信
  const baseUrl = process.env.AUTH_URL || 'http://localhost:3000';
  console.log('[RegisterAdmin] Preparing to send email. BaseURL:', baseUrl);
  
  const emailGateway = getEmailGateway();
  console.log('[RegisterAdmin] Got EmailGateway.');

  console.log('[RegisterAdmin] Calling sendAdminVerificationEmail...');
  console.log(`[RegisterAdmin] To: ${email}, Name: ${name}`);
  
  const startTime = Date.now();
  const emailResult = await sendAdminVerificationEmail(emailGateway, {
    to: email,
    name,
    verificationToken: result.verificationToken,
    baseUrl,
  });
  const duration = Date.now() - startTime;
  console.log(`[RegisterAdmin] Email sending finished in ${duration}ms.`);

  if (!emailResult.success) {
    console.error('[RegisterAdmin] ERROR: Email sending failed!');
    console.error('[RegisterAdmin] Error details:', emailResult.error);
    console.error('[RegisterAdmin] MessageId:', emailResult.messageId);
  } else {
    console.log('[RegisterAdmin] Email sent successfully.');
    console.log('[RegisterAdmin] MessageId:', emailResult.messageId);
  }

  // 開発環境: コンソールに確認URLを表示
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========================================');
    console.log('管理者登録完了 - メール確認URL');
    console.log('========================================');
    console.log('Email:', email);
    console.log('Verification URL:', `${baseUrl}/admin/verify-email?token=${result.verificationToken}`);
    console.log(`有効期限: ${VERIFICATION_TOKEN_EXPIRY_MINUTES}分`);
    console.log('========================================\n');
  }

  return result;
}
