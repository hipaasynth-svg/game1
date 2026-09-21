import type pg from 'pg';
import { playRound, secureRandomInt, type GameConfig, type RoundResult } from '@game1/game-engine';
import { getBalanceMicros, postLedgerEntry } from './ledger.js';
import { applyMultiplier } from './money.js';
import { PlayerNotFoundError } from './players.js';

export class InsufficientFundsError extends Error {
  constructor(playerId: string) {
    super(`Insufficient funds for player: ${playerId}`);
    this.name = 'InsufficientFundsError';
  }
}

export interface SpinOutcome {
  round: RoundResult;
  betMicros: bigint;
  winMicros: bigint;
  balanceMicros: bigint;
}

// The one place a spin actually happens: locks the player's row so
// concurrent requests for the same player serialize (no double-spend),
// debits the wager, resolves the round with the server's own CSPRNG
// (playRound — see @game1/game-engine), credits any win, and records the
// full result for audit — all in one atomic transaction. The client only
// ever sees the result of this; it never computes an outcome itself.
export async function playSpin(
  pool: pg.Pool,
  playerId: string,
  betMicros: bigint,
  config: GameConfig,
): Promise<SpinOutcome> {
  if (betMicros <= 0n) throw new Error('betMicros must be positive');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT id FROM players WHERE id = $1 FOR UPDATE', [playerId]);
    if (rows.length === 0) throw new PlayerNotFoundError(playerId);

    const balanceBeforeWager = await getBalanceMicros(client, playerId);
    if (balanceBeforeWager < betMicros) throw new InsufficientFundsError(playerId);

    await postLedgerEntry(client, { playerId, amountMicros: -betMicros, reason: 'spin_wager' });

    const round = playRound(config, secureRandomInt);
    const winMicros = applyMultiplier(betMicros, round.totalWinMultiplier);

    const { rows: roundRows } = await client.query<{ id: string }>(
      `INSERT INTO spin_rounds (player_id, bet_micros, win_micros, result)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [playerId, betMicros, winMicros, JSON.stringify(round)],
    );
    const roundId = roundRows[0].id;

    if (winMicros > 0n) {
      await postLedgerEntry(client, { playerId, amountMicros: winMicros, reason: 'spin_win', roundId });
    }

    const balanceMicros = await getBalanceMicros(client, playerId);
    await client.query('COMMIT');

    return { round, betMicros, winMicros, balanceMicros };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
