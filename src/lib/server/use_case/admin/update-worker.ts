import { prisma } from '@/lib/server/infra/prisma';

export type UpdateWorkerInput = {
  workerId: string;
  organizationId: string;
  hourlyRateUsd?: number;
  isActive?: boolean;
};

export type UpdateWorkerResult = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  updatedAt: Date;
};

/**
 * 従業員情報を更新
 */
export async function updateWorker(input: UpdateWorkerInput): Promise<UpdateWorkerResult> {
  const { workerId, organizationId, hourlyRateUsd, isActive } = input;

  // 従業員が組織に所属しているか確認
  const worker = await prisma.workerUser.findFirst({
    where: {
      id: workerId,
      organizationId,
    },
  });

  if (!worker) {
    throw new Error('従業員が見つかりません');
  }

  // 更新データを準備
  const updateData: {
    hourlyRateUsd?: number;
    isActive?: boolean;
  } = {};

  if (hourlyRateUsd !== undefined) {
    updateData.hourlyRateUsd = hourlyRateUsd;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  // 従業員情報を更新
  const updatedWorker = await prisma.workerUser.update({
    where: { id: workerId },
    data: updateData,
  });

  return {
    id: updatedWorker.id,
    name: updatedWorker.name,
    email: updatedWorker.email,
    hourlyRateUsd: Number(updatedWorker.hourlyRateUsd),
    isActive: updatedWorker.isActive,
    updatedAt: updatedWorker.updatedAt,
  };
}
