import { Pool } from 'pg';

const globalForTimescale = globalThis as unknown as {
  timescalePool: Pool | undefined;
};

export const timescalePool =
  globalForTimescale.timescalePool ??
  new Pool({
    connectionString: process.env.TIMESCALE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForTimescale.timescalePool = timescalePool;
}

export async function queryTimescale<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await timescalePool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// 既存コードとの互換性のためのオブジェクト形式
export const timescaleDb = {
  query: queryTimescale,
};
