import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { setupTestDb, truncateAll } from './testDb.js';
import { createPlayer, getPlayerBalance, PlayerNotFoundError } from './players.js';

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

describe('createPlayer', () => {
  it('creates a player with the welcome bonus balance', async () => {
    const { playerId, balanceMicros } = await createPlayer(pool);
    expect(balanceMicros).toBe(10_000n * 1_000_000n);

    const balance = await getPlayerBalance(pool, playerId);
    expect(balance).toBe(balanceMicros);
  });
});

describe('getPlayerBalance', () => {
  it('throws PlayerNotFoundError for an unknown player', async () => {
    await expect(getPlayerBalance(pool, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      PlayerNotFoundError,
    );
  });
});
