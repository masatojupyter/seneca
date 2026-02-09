'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { getWorkerAddresses } from '@/lib/server/use_case/wallet/get-worker-addresses';
import { createCryptoAddress } from '@/lib/server/use_case/wallet/create-crypto-address';
import { updateCryptoAddress } from '@/lib/server/use_case/wallet/update-crypto-address';
import { deleteCryptoAddress } from '@/lib/server/use_case/wallet/delete-crypto-address';

const cryptoTypeSchema = z.enum(['XRP', 'RLUSD']);

const createAddressSchema = z.object({
  cryptoType: cryptoTypeSchema,
  address: z.string().min(1, 'アドレスを入力してください'),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  id: z.string().cuid(),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const deleteAddressSchema = z.object({
  id: z.string().cuid(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type DeleteAddressInput = z.infer<typeof deleteAddressSchema>;

export type AddressItem = {
  id: string;
  workerId: string;
  cryptoType: string;
  address: string;
  label: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetAddressesResult = {
  success: boolean;
  error?: string;
  addresses?: AddressItem[];
};

export type CreateAddressResult = {
  success: boolean;
  error?: string;
  address?: AddressItem;
};

export type UpdateAddressResult = {
  success: boolean;
  error?: string;
  address?: AddressItem;
};

export type DeleteAddressResult = {
  success: boolean;
  error?: string;
};

/**
 * アドレス一覧を取得
 */
export async function getAddressesAction(): Promise<GetAddressesResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const addresses = await getWorkerAddresses(session.user.id);

    return {
      success: true,
      addresses: addresses.map((addr) => ({
        id: addr.id,
        workerId: addr.workerId,
        cryptoType: addr.cryptoType,
        address: addr.address,
        label: addr.label,
        isDefault: addr.isDefault,
        isActive: addr.isActive,
        createdAt: addr.createdAt.toISOString(),
        updatedAt: addr.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Get addresses error:', error);
    return {
      success: false,
      error: 'アドレスの取得に失敗しました',
    };
  }
}

/**
 * アドレスを作成
 */
export async function createAddressAction(
  data: CreateAddressInput
): Promise<CreateAddressResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = createAddressSchema.parse(data);

    const address = await createCryptoAddress({
      workerId: session.user.id,
      cryptoType: validatedData.cryptoType,
      address: validatedData.address,
      label: validatedData.label,
      isDefault: validatedData.isDefault,
    });

    return {
      success: true,
      address: {
        id: address.id,
        workerId: address.workerId,
        cryptoType: address.cryptoType,
        address: address.address,
        label: address.label,
        isDefault: address.isDefault,
        isActive: address.isActive,
        createdAt: address.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Create address error:', error);
    return {
      success: false,
      error: 'アドレスの作成に失敗しました',
    };
  }
}

/**
 * アドレスを更新
 */
export async function updateAddressAction(
  data: UpdateAddressInput
): Promise<UpdateAddressResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = updateAddressSchema.parse(data);

    const address = await updateCryptoAddress({
      id: validatedData.id,
      workerId: session.user.id,
      label: validatedData.label,
      isDefault: validatedData.isDefault,
      isActive: validatedData.isActive,
    });

    return {
      success: true,
      address: {
        id: address.id,
        workerId: address.workerId,
        cryptoType: address.cryptoType,
        address: address.address,
        label: address.label,
        isDefault: address.isDefault,
        isActive: address.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: address.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Update address error:', error);
    return {
      success: false,
      error: 'アドレスの更新に失敗しました',
    };
  }
}

/**
 * アドレスを削除
 */
export async function deleteAddressAction(
  data: DeleteAddressInput
): Promise<DeleteAddressResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const validatedData = deleteAddressSchema.parse(data);

    await deleteCryptoAddress({
      id: validatedData.id,
      workerId: session.user.id,
    });

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('Delete address error:', error);
    return {
      success: false,
      error: 'アドレスの削除に失敗しました',
    };
  }
}
