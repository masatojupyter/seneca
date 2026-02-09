import { prisma } from '@/lib/server/infra/prisma';
import { NotFoundError, ValidationError } from '@/lib/server/errors';

type CancelWorkerInvitationInput = {
  invitationId: string;
  organizationId: string;
};

/**
 * 招待を取り消し（ハードデリート）
 */
export async function cancelWorkerInvitation(input: CancelWorkerInvitationInput): Promise<void> {
  const { invitationId, organizationId } = input;

  const invitation = await prisma.workerInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
    },
  });

  if (!invitation) {
    throw new NotFoundError('招待が見つかりません');
  }

  if (invitation.acceptedAt) {
    throw new ValidationError('受諾済みの招待は取り消しできません');
  }

  await prisma.workerInvitation.delete({
    where: { id: invitationId },
  });
}
