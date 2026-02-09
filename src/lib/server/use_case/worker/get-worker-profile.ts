import { prisma } from '@/lib/server/infra/prisma';

export type WorkerProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  hourlyRateUsd: number;
  isActive: boolean;
  createdAt: Date;
};

/**
 * 従業員が自身のプロフィール情報を取得
 */
export async function getWorkerProfile(
  workerId: string
): Promise<WorkerProfile | null> {
  const worker = await prisma.workerUser.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      hourlyRateUsd: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!worker) {
    return null;
  }

  return {
    id: worker.id,
    name: worker.name,
    email: worker.email,
    image: worker.image,
    hourlyRateUsd: Number(worker.hourlyRateUsd),
    isActive: worker.isActive,
    createdAt: worker.createdAt,
  };
}
