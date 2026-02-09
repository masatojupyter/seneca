import { prisma } from '@/lib/server/infra/prisma';

export type OrganizationDetail = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  adminCount: number;
  workerCount: number;
};

/**
 * 組織情報を取得
 */
export async function getOrganization(organizationId: string): Promise<OrganizationDetail> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          adminUsers: true,
          workerUsers: true,
        },
      },
    },
  });

  if (!organization) {
    throw new Error('組織が見つかりません');
  }

  return {
    id: organization.id,
    name: organization.name,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    adminCount: organization._count.adminUsers,
    workerCount: organization._count.workerUsers,
  };
}
