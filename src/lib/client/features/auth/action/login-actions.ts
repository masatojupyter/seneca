'use server';

import { z } from 'zod';
import { adminSignIn } from '@/lib/server/infra/auth-admin';
import { workerSignIn } from '@/lib/server/infra/auth-worker';
import { AuthError } from 'next-auth';

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  organizationId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type LoginResult = {
  success: boolean;
  error?: string;
};

/**
 * 管理者ログイン
 */
export async function adminLoginAction(data: LoginInput): Promise<LoginResult> {
  try {
    // バリデーション
    const validatedData = loginSchema.parse(data);

    // ログイン実行
    await adminSignIn('admin-credentials', {
      email: validatedData.email,
      password: validatedData.password,
      organizationId: validatedData.organizationId,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof AuthError) {
      return {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません',
      };
    }

    console.error('Admin login error:', error);
    return {
      success: false,
      error: 'ログインに失敗しました。もう一度お試しください。',
    };
  }
}

/**
 * 従業員ログイン
 */
export async function workerLoginAction(data: LoginInput): Promise<LoginResult> {
  try {
    // バリデーション
    const validatedData = loginSchema.parse(data);

    // ログイン実行
    await workerSignIn('worker-credentials', {
      email: validatedData.email,
      password: validatedData.password,
      organizationId: validatedData.organizationId,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof AuthError) {
      return {
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません',
      };
    }

    console.error('Worker login error:', error);
    return {
      success: false,
      error: 'ログインに失敗しました。もう一度お試しください。',
    };
  }
}
