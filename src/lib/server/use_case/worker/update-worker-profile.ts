import { prisma } from '@/lib/server/infra/prisma';

export type UpdateWorkerProfileInput = {
  workerId: string;
  name?: string;
  image?: string | null;
};

export type UpdateWorkerProfileResult = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  updatedAt: Date;
};

/**
 * 従業員が自身のプロフィールを更新（名前・画像のみ）
 */
export async function updateWorkerProfile(
  input: UpdateWorkerProfileInput
): Promise<UpdateWorkerProfileResult> {
  const { workerId, name, image } = input;

  const worker = await prisma.workerUser.findUnique({
    where: { id: workerId },
  });

  if (!worker) {
    throw new Error('従業員が見つかりません');
  }

  const updateData: { name?: string; image?: string | null } = {};

  if (name !== undefined) {
    if (name.trim().length === 0) {
      throw new Error('名前を入力してください');
    }
    updateData.name = name.trim();
  }

  if (image !== undefined) {
    updateData.image = image;
  }

  const updatedWorker = await prisma.workerUser.update({
    where: { id: workerId },
    data: updateData,
  });

  return {
    id: updatedWorker.id,
    name: updatedWorker.name,
    email: updatedWorker.email,
    image: updatedWorker.image,
    updatedAt: updatedWorker.updatedAt,
  };
}
