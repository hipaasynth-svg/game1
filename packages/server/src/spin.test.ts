import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { defaultGameConfig, type GameConfig } from '@game1/game-engine';
import { setupTestDb, truncateAll } from './testDb.js';
import { createPlayer } from './players.js';
import { InsufficientFundsError, playSpin } from './spin.js';

let pool: pg.Pool;

beforeAll(async () => {
  pool = await setupTestDb();
});

beforeEach(async () => {
  await truncateAll(pool);
});

afterAll(async () => {
  await pool.end();
});

// All-scatter grid: scatter never forms a paying cluster (see
// game-engine's clusters.test.ts), and the trigger/retrigger thresholds
// are unreachable, so totalWinMultiplier is deterministically always 0.
// Used for tests that need to reason exactly about balance changes.
const zeroWinConfig: GameConfig = {
  ...defaultGameConfig,
  symbolWeights: [{ symbol: 'web_scatter', weight: 1 }],
  freeSpinsTriggerCount: 999,
};

async function grandLedgerTotal(): Promise<bigint> {
  const { rows } = await pool.query('SELECT COALESCE(SUM(amount_micros), 0) AS total FROM ledger_entries');
  return BigInt(rows[0].total);
}

describe('playSpin', () => {
  it('throws PlayerNotFoundError for an unknown player and posts nothing', async () => {
    await expect(
      playSpin(pool, '00000000-0000-0000-0000-000000000000', 1_000_000n, zeroWinConfig),
    ).rejects.toThrow('Player not found');
    expect(await grandLedgerTotal()).toBe(0n);
  });

  it('rejects a bet larger than the balance and leaves the balance unchanged', async () => {
    const { playerId, balanceMicros } = await createPlayer(pool);
    await expect(playSpin(pool, playerId, balanceMicros + 1n, zeroWinConfig)).rejects.toThrow(
      InsufficientFundsError,
    );

    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount_micros), 0) AS balance FROM ledger_entries WHERE player_id = $1`,
      [playerId],
    );
    expect(BigInt(rows[0].balance)).toBe(balanceMicros);
  });

  it('debits exactly the bet on a guaranteed-zero-win spin', async () => {
    const { playerId, balanceMicros } = await createPlayer(pool);
    const betMicros = 1_000_000n; // 1 GC

    const outcome = await playSpin(pool, playerId, betMicros, zeroWinConfig);

    expect(outcome.winMicros).toBe(0n);
    expect(outcome.balanceMicros).toBe(balanceMicros - betMicros);
    expect(outcome.round.totalWinMultiplier).toBe(0);
  });

  it('keeps balance/bet/win consistent across many real spins, and the ledger zero-sum invariant holds', async () => {
    const { playerId, balanceMicros: startingBalance } = await createPlayer(pool);
    const betMicros = 1_000_000n; // 1 GC
    let expectedBalance = startingBalance;

    for (let i = 0; i < 30; i += 1) {
      const outcome = await playSpin(pool, playerId, betMicros, defaultGameConfig);
      expectedBalance = expectedBalance - betMicros + outcome.winMicros;
      expect(outcome.balanceMicros).toBe(expectedBalance);
    }

    expect(await grandLedgerTotal()).toBe(0n);
  });

  it('serializes concurrent spins for the same player so only one can spend the whole balance', async () => {
    const { playerId, balanceMicros } = await createPlayer(pool);

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => playSpin(pool, playerId, balanceMicros, zeroWinConfig)),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    for (const r of rejected) {
      if (r.status === 'rejected') expect(r.reason).toBeInstanceOf(InsufficientFundsError);
    }

    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount_micros), 0) AS balance FROM ledger_entries WHERE player_id = $1`,
      [playerId],
    );
    expect(BigInt(rows[0].balance)).toBe(0n);
    expect(await grandLedgerTotal()).toBe(0n);
  });
});
