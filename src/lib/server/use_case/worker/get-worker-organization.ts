import { prisma } from '@/lib/server/infra/prisma';

export type WorkerOrganization = {
  id: string;
  name: string;
  createdAt: Date;
  workerCount: number;
};

/**
 * 従業員が所属する組織情報を取得
 */
export async function getWorkerOrganization(
  workerId: string
): Promise<WorkerOrganization | null> {
  const worker = await prisma.workerUser.findUnique({
    where: { id: workerId },
    select: {
      organizationId: true,
    },
  });

  if (!worker) {
    return null;
  }

  const organization = await prisma.organization.findUnique({
    where: { id: worker.organizationId },
    include: {
      _count: {
        select: {
          workerUsers: { where: { isActive: true } },
        },
      },
    },
  });

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    createdAt: organization.createdAt,
    workerCount: organization._count.workerUsers,
  };
}
