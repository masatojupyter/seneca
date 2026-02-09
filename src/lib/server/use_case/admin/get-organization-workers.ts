import { prisma } from '@/lib/server/infra/prisma';

export type WorkerListItem = {
  id: string;
  name: string;
  email: string;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 組織の従業員一覧を取得
 */
export async function getOrganizationWorkers(organizationId: string): Promise<WorkerListItem[]> {
  const workers = await prisma.workerUser.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return workers.map((worker) => ({
    id: worker.id,
    name: worker.name,
    email: worker.email,
    hourlyRateUsd: Number(worker.hourlyRateUsd),
    isActive: worker.isActive,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
  }));
}
