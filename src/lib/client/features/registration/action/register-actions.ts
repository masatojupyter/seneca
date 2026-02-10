'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { registerAdmin } from '@/lib/server/use_case/auth/register-admin';
import type { EmailLocale } from '@/lib/server/gateway/email-gateway';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE: EmailLocale = 'en-us';

async function getLocaleFromCookies(): Promise<EmailLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return cookieLocale === 'ja-jp' ? 'ja-jp' : DEFAULT_LOCALE;
}

const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  passwordConfirm: z.string(),
  name: z.string().min(1, '名前を入力してください'),
  organizationName: z.string().min(1, '組織名を入力してください'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirm'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export type RegisterResult = {
  success: boolean;
  verificationToken?: string;
  error?: string;
};

/**
 * 管理者登録
 */
export async function registerAdminAction(data: RegisterInput): Promise<RegisterResult> {
  try {
    // バリデーション
    const validatedData = registerSchema.parse(data);

    // ロケールを取得
    const locale = await getLocaleFromCookies();

    // 管理者登録
    const result = await registerAdmin({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      organizationName: validatedData.organizationName,
      locale,
    });

    // 本来はここでメール送信処理を行う
    // await sendVerificationEmail(validatedData.email, result.verificationToken);

    return {
      success: true,
      verificationToken: result.verificationToken,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Register error:', error);
    return {
      success: false,
      error: '登録に失敗しました。もう一度お試しください。',
    };
  }
}
