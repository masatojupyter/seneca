'use server';

import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getWorkerOrganization } from '@/lib/server/use_case/worker/get-worker-organization';

export type OrganizationData = {
  id: string;
  name: string;
  createdAt: string;
  workerCount: number;
};

export type GetOrganizationResult = {
  success: boolean;
  error?: string;
  organization?: OrganizationData;
};

/**
 * 所属組織情報を取得
 */
export async function getOrganizationAction(): Promise<GetOrganizationResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const organization = await getWorkerOrganization(session.user.id);

    if (!organization) {
      return { success: false, error: '組織情報が見つかりません' };
    }

    return {
      success: true,
      organization: {
        ...organization,
        createdAt: organization.createdAt.toISOString(),
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
