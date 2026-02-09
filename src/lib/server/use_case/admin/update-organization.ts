import { prisma } from '@/lib/server/infra/prisma';

type UpdateOrganizationInput = {
  organizationId: string;
  name: string;
};

/**
 * 組織情報を更新
 */
export async function updateOrganization(input: UpdateOrganizationInput): Promise<void> {
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });

  if (!organization) {
    throw new Error('組織が見つかりません');
  }

  await prisma.organization.update({
    where: { id: input.organizationId },
    data: { name: input.name },
  });
}
