'use server';

import { z } from 'zod';
import { verifyAdminEmail } from '@/lib/server/use_case/auth/verify-admin-email';

const verifyEmailSchema = z.object({
  token: z.string().min(1, '確認トークンが指定されていません'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type VerifyEmailResult = {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    name: string;
  };
  error?: string;
};

/**
 * メールアドレス確認
 */
export async function verifyAdminEmailAction(
  input: VerifyEmailInput
): Promise<VerifyEmailResult> {
  try {
    const validatedData = verifyEmailSchema.parse(input);

    const result = await verifyAdminEmail({
      token: validatedData.token,
    });

    return {
      success: true,
      data: {
        userId: result.userId,
        email: result.email,
        name: result.name,
      },
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

    console.error('Verify email error:', error);
    return {
      success: false,
      error: 'メール確認に失敗しました。もう一度お試しください。',
    };
  }
}
