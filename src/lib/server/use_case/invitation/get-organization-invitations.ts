import { prisma } from '@/lib/server/infra/prisma';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export type InvitationListItem = {
  id: string;
  email: string;
  hourlyRateUsd: number;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
};

function deriveStatus(acceptedAt: Date | null, expiresAt: Date): InvitationStatus {
  if (acceptedAt) return 'ACCEPTED';
  if (expiresAt < new Date()) return 'EXPIRED';
  return 'PENDING';
}

/**
 * 組織の招待一覧を取得
 */
export async function getOrganizationInvitations(organizationId: string): Promise<InvitationListItem[]> {
  const invitations = await prisma.workerInvitation.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    hourlyRateUsd: Number(invitation.hourlyRateUsd),
    status: deriveStatus(invitation.acceptedAt, invitation.expiresAt),
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    acceptedAt: invitation.acceptedAt,
  }));
}
