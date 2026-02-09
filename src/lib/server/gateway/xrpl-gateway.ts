import { withXrplClient } from '@/lib/server/infra/xrpl-client';

type AccountBalance = {
  xrp: number;
};

/**
 * XRP Ledgerからアカウント残高を取得
 * アカウント未アクティブ（未funded）の場合は残高0を返す
 */
export async function getAccountBalance(address: string): Promise<AccountBalance> {
  try {
    return await withXrplClient(async (client) => {
      const response = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });

      const balanceDrops = Number(response.result.account_data.Balance);
      const xrp = balanceDrops / 1_000_000;

      return { xrp };
    });
  } catch (error: unknown) {
    // actNotFound: アカウントが未アクティブ（未funded）
    if (error instanceof Error && error.message.includes('actNotFound')) {
      return { xrp: 0 };
    }
    console.error(`Failed to get balance for ${address}:`, error);
    return { xrp: 0 };
  }
}
