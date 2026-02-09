import { prisma } from '@/lib/server/infra/prisma';
import { NotFoundError, ValidationError } from '@/lib/server/errors';

type ResendWorkerInvitationInput = {
  invitationId: string;
  organizationId: string;
};

type ResendWorkerInvitationOutput = {
  newInvitationId: string;
  token: string;
};

/**
 * 招待を再送（旧招待を削除し新規作成）
 */
export async function resendWorkerInvitation(input: ResendWorkerInvitationInput): Promise<ResendWorkerInvitationOutput> {
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
    throw new ValidationError('受諾済みの招待は再送できません');
  }

  if (invitation.expiresAt > new Date()) {
    throw new ValidationError('有効期限内の招待は再送できません。取り消してから再招待してください');
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const newInvitation = await prisma.$transaction(async (tx) => {
    await tx.workerInvitation.delete({
      where: { id: invitationId },
    });

    return tx.workerInvitation.create({
      data: {
        email: invitation.email,
        token,
        hourlyRateUsd: invitation.hourlyRateUsd,
        organizationId,
        expiresAt,
      },
    });
  });

  return {
    newInvitationId: newInvitation.id,
    token,
  };
}
