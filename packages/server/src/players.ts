import type pg from 'pg';
import { getBalanceMicros, postLedgerEntry } from './ledger.js';

// No purchase flow yet (Stripe integration is a separate, deliberately
// out-of-scope next step — see PR description). This welcome grant is
// what makes the server actually playable for now; it's a placeholder for
// real GC purchases, not a permanent feature.
const WELCOME_BONUS_MICROS = 10_000n * 1_000_000n; // 10,000 GC

export async function createPlayer(pool: pg.Pool): Promise<{ playerId: string; balanceMicros: bigint }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>('INSERT INTO players DEFAULT VALUES RETURNING id');
    const playerId = rows[0].id;
    await postLedgerEntry(client, {
      playerId,
      amountMicros: WELCOME_BONUS_MICROS,
      reason: 'welcome_bonus',
    });
    await client.query('COMMIT');
    return { playerId, balanceMicros: WELCOME_BONUS_MICROS };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export class PlayerNotFoundError extends Error {
  constructor(playerId: string) {
    super(`Player not found: ${playerId}`);
    this.name = 'PlayerNotFoundError';
  }
}

export async function getPlayerBalance(pool: pg.Pool, playerId: string): Promise<bigint> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT 1 FROM players WHERE id = $1', [playerId]);
    if (rows.length === 0) throw new PlayerNotFoundError(playerId);
    return await getBalanceMicros(client, playerId);
  } finally {
    client.release();
  }
}
