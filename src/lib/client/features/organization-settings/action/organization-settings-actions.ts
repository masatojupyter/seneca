'use server';

import { z } from 'zod';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { getOrganization } from '@/lib/server/use_case/admin/get-organization';
import { updateOrganization } from '@/lib/server/use_case/admin/update-organization';

export type OrganizationData = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  adminCount: number;
  workerCount: number;
};

export type GetOrganizationResult = {
  success: boolean;
  error?: string;
  data?: OrganizationData;
};

export type UpdateOrganizationResult = {
  success: boolean;
  error?: string;
};

const updateOrganizationSchema = z.object({
  name: z.string().min(1, '組織名は必須です').max(100, '組織名は100文字以内で入力してください'),
});

/**
 * 組織情報を取得
 */
export async function getOrganizationAction(): Promise<GetOrganizationResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const organization = await getOrganization(session.user.organizationId);

    return {
      success: true,
      data: {
        id: organization.id,
        name: organization.name,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        adminCount: organization.adminCount,
        workerCount: organization.workerCount,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Get organization error:', error);
    return { success: false, error: '組織情報の取得に失敗しました' };
  }
}

/**
 * 組織情報を更新
 */
export async function updateOrganizationAction(name: string): Promise<UpdateOrganizationResult> {
  try {
    const session = await adminAuth();
    if (!session?.user?.organizationId) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = updateOrganizationSchema.parse({ name });

    await updateOrganization({
      organizationId: session.user.organizationId,
      name: validated.name,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    console.error('Update organization error:', error);
    return { success: false, error: '組織情報の更新に失敗しました' };
  }
}
