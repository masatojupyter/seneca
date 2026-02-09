'use server';

import { z } from 'zod';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import {
  searchPaymentHashForWorker,
  searchPaymentHashForAdmin,
} from '@/lib/server/use_case/payment-hash/search-payment-hash';
import type { PaymentHashSearchResult } from '@/lib/server/use_case/payment-hash/search-payment-hash';

const HASH_LENGTH = 64;

const searchHashSchema = z.object({
  dataHash: z
    .string()
    .min(1, 'ハッシュ値を入力してください')
    .regex(/^[a-fA-F0-9]+$/, '16進数の文字列を入力してください')
    .transform((v) => v.toLowerCase()),
});

export type SearchHashInput = z.infer<typeof searchHashSchema>;

export type SearchHashResult = {
  success: boolean;
  error?: string;
  results?: PaymentHashSearchResult[];
};

/**
 * hex文字列からdata_hashを抽出する
 * - 64文字のhex → そのままSHA-256ハッシュとして扱う
 * - それ以外 → hexデコードしてJSONパースし、dataHashフィールドを取得
 */
function extractDataHash(hexInput: string): string | null {
  if (hexInput.length === HASH_LENGTH) {
    return hexInput;
  }

  try {
    const decoded = Buffer.from(hexInput, 'hex').toString('utf-8');
    const parsed: unknown = JSON.parse(decoded);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'dataHash' in parsed &&
      typeof (parsed as Record<string, unknown>).dataHash === 'string'
    ) {
      const hash = (parsed as Record<string, string>).dataHash.toLowerCase();
      if (hash.length === HASH_LENGTH && /^[a-f0-9]+$/.test(hash)) {
        return hash;
      }
    }
  } catch {
    // hexデコードまたはJSONパース失敗
  }

  return null;
}

/**
 * 従業員用: ハッシュ値で支払いデータを検索
 */
export async function searchHashForWorkerAction(
  input: SearchHashInput
): Promise<SearchHashResult> {
  try {
    const session = await workerAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = searchHashSchema.parse(input);

    const dataHash = extractDataHash(validated.dataHash);
    if (!dataHash) {
      return {
        success: false,
        error: 'SHA-256ハッシュ値（64文字）またはMemoDataのhex文字列を入力してください',
      };
    }

    const results = await searchPaymentHashForWorker(
      dataHash,
      session.user.id
    );

    return { success: true, results };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Worker hash search error:', error);
    return { success: false, error: 'ハッシュ検索に失敗しました' };
  }
}

/**
 * 管理者用: ハッシュ値で支払いデータを検索
 */
export async function searchHashForAdminAction(
  input: SearchHashInput
): Promise<SearchHashResult> {
  try {
    const session = await adminAuth();
    if (!session?.user) {
      return { success: false, error: '認証が必要です' };
    }

    const validated = searchHashSchema.parse(input);

    const dataHash = extractDataHash(validated.dataHash);
    if (!dataHash) {
      return {
        success: false,
        error: 'SHA-256ハッシュ値（64文字）またはMemoDataのhex文字列を入力してください',
      };
    }

    const results = await searchPaymentHashForAdmin(
      dataHash,
      session.user.organizationId
    );

    return { success: true, results };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Admin hash search error:', error);
    return { success: false, error: 'ハッシュ検索に失敗しました' };
  }
}
