import { Client } from 'xrpl';

const XRPL_ENDPOINTS: Record<string, string> = {
  testnet: 'wss://s.altnet.rippletest.net:51233',
  mainnet: 'wss://xrplcluster.com',
};

const network = process.env.XRPL_NETWORK ?? 'testnet';
const endpoint = XRPL_ENDPOINTS[network] ?? XRPL_ENDPOINTS.testnet;

/**
 * XRPL Clientを取得して接続する
 * 毎回新規接続 → 処理後にdisconnectするパターン
 */
export async function withXrplClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(endpoint);
  try {
    await client.connect();
    return await fn(client);
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
}
