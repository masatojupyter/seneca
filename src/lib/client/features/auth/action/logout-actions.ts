'use server';

import { adminSignOut } from '@/lib/server/infra/auth-admin';
import { workerSignOut } from '@/lib/server/infra/auth-worker';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/client/routes';

/**
 * 管理者ログアウト
 * Server Actionからのリダイレクトは例外をスローするため、呼び出し元でキャッチ不要
 */
export async function adminLogoutAction(): Promise<never> {
  await adminSignOut();
  redirect(ROUTES.ADMIN_LOGIN);
}

/**
 * 従業員ログアウト
 * Server Actionからのリダイレクトは例外をスローするため、呼び出し元でキャッチ不要
 */
export async function workerLogoutAction(): Promise<never> {
  await workerSignOut();
  redirect(ROUTES.WORKER_LOGIN);
}
