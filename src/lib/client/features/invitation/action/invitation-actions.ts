'use server';

import { z } from 'zod';
import { sendWorkerInvitation } from '@/lib/server/use_case/invitation/send-worker-invitation';
import { acceptWorkerInvitation } from '@/lib/server/use_case/invitation/accept-worker-invitation';
import { getOrganizationInvitations } from '@/lib/server/use_case/invitation/get-organization-invitations';
import { cancelWorkerInvitation } from '@/lib/server/use_case/invitation/cancel-worker-invitation';
import { resendWorkerInvitation } from '@/lib/server/use_case/invitation/resend-worker-invitation';
import { adminAuth } from '@/lib/server/infra/auth-admin';

const sendInvitationSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  hourlyRateUsd: z.number().positive('時給は0より大きい値を入力してください'),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'トークンが必要です'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  passwordConfirm: z.string(),
  name: z.string().min(1, '名前を入力してください'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'パスワードが一致しません',
  path: ['passwordConfirm'],
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export type InvitationResult = {
  success: boolean;
  token?: string;
  error?: string;
};

/**
 * 従業員招待送信
 */
export async function sendWorkerInvitationAction(data: SendInvitationInput): Promise<InvitationResult> {
  try {
    // 認証チェック
    const session = await adminAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedData = sendInvitationSchema.parse(data);

    // 招待送信
    const result = await sendWorkerInvitation({
      email: validatedData.email,
      hourlyRateUsd: validatedData.hourlyRateUsd,
      organizationId: session.user.organizationId,
      adminId: session.user.id,
    });

    return {
      success: true,
      token: result.token,
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

    console.error('Send invitation error:', error);
    return {
      success: false,
      error: '招待の送信に失敗しました',
    };
  }
}

/**
 * 従業員招待受諾
 */
export async function acceptWorkerInvitationAction(data: AcceptInvitationInput): Promise<InvitationResult> {
  try {
    // バリデーション
    const validatedData = acceptInvitationSchema.parse(data);

    // 招待受諾
    await acceptWorkerInvitation({
      token: validatedData.token,
      password: validatedData.password,
      name: validatedData.name,
    });

    return { success: true };
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

    console.error('Accept invitation error:', error);
    return {
      success: false,
      error: '招待の受諾に失敗しました',
    };
  }
}

// --- 招待管理アクション ---

export type InvitationListItemDTO = {
  id: string;
  email: string;
  hourlyRateUsd: number;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
};

export type GetInvitationsResult = {
  success: boolean;
  invitations?: InvitationListItemDTO[];
  error?: string;
};

export type CancelInvitationResult = {
  success: boolean;
  error?: string;
};

export type ResendInvitationResult = {
  success: boolean;
  token?: string;
  error?: string;
};

const cancelInvitationSchema = z.object({
  invitationId: z.string().cuid(),
});

const resendInvitationSchema = z.object({
  invitationId: z.string().cuid(),
});

/**
 * 招待一覧を取得
 */
export async function getInvitationsAction(): Promise<GetInvitationsResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const invitations = await getOrganizationInvitations(session.user.organizationId);

    return {
      success: true,
      invitations: invitations.map((inv) => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get invitations error:', error);
    return {
      success: false,
      error: '招待一覧の取得に失敗しました',
    };
  }
}

/**
 * 招待を取り消し
 */
export async function cancelInvitationAction(data: { invitationId: string }): Promise<CancelInvitationResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = cancelInvitationSchema.parse(data);

    await cancelWorkerInvitation({
      invitationId: validatedData.invitationId,
      organizationId: session.user.organizationId,
    });

    return { success: true };
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

    console.error('Cancel invitation error:', error);
    return {
      success: false,
      error: '招待の取り消しに失敗しました',
    };
  }
}

/**
 * 招待を再送
 */
export async function resendInvitationAction(data: { invitationId: string }): Promise<ResendInvitationResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = resendInvitationSchema.parse(data);

    const result = await resendWorkerInvitation({
      invitationId: validatedData.invitationId,
      organizationId: session.user.organizationId,
    });

    return {
      success: true,
      token: result.token,
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

    console.error('Resend invitation error:', error);
    return {
      success: false,
      error: '招待の再送に失敗しました',
    };
  }
}
