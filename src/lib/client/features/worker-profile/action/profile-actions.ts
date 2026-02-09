'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getWorkerProfile } from '@/lib/server/use_case/worker/get-worker-profile';
import { updateWorkerProfile } from '@/lib/server/use_case/worker/update-worker-profile';

export type WorkerProfileData = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: string;
};

export type GetProfileResult = {
  success: boolean;
  error?: string;
  profile?: WorkerProfileData;
};

export type UpdateProfileResult = {
  success: boolean;
  error?: string;
  profile?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    updatedAt: string;
  };
};

const updateProfileSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100).optional(),
  image: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * プロフィール情報を取得
 */
export async function getProfileAction(): Promise<GetProfileResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const profile = await getWorkerProfile(session.user.id);

    if (!profile) {
      return { success: false, error: 'プロフィールが見つかりません' };
    }

    return {
      success: true,
      profile: {
        ...profile,
        createdAt: profile.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Get profile error:', error);
    return { success: false, error: 'プロフィールの取得に失敗しました' };
  }
}

/**
 * プロフィールを更新
 */
export async function updateProfileAction(
  data: UpdateProfileInput
): Promise<UpdateProfileResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validatedData = updateProfileSchema.parse(data);

    const profile = await updateWorkerProfile({
      workerId: session.user.id,
      ...validatedData,
    });

    return {
      success: true,
      profile: {
        ...profile,
        updatedAt: profile.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Update profile error:', error);
    return { success: false, error: 'プロフィールの更新に失敗しました' };
  }
}
