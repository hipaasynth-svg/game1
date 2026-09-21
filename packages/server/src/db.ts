import pg from 'pg';

// node-postgres returns BIGINT (OID 20) as strings by default, to avoid
// silently losing precision above Number.MAX_SAFE_INTEGER. We want BigInt
// instead so money math (money.ts) never has to round-trip through a
// string — this is the one place that global parser config lives.
pg.types.setTypeParser(20, BigInt);

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString });
}

export type DbClient = pg.PoolClient;
