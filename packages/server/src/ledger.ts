import { randomUUID } from 'node:crypto';
import type { DbClient } from './db.js';

export type LedgerReason = 'welcome_bonus' | 'spin_wager' | 'spin_win';

// Posts one balanced double-entry transaction: a 'player' row and a
// 'house' row whose amounts are exact opposites, sharing a transaction_id.
// Must be called inside an open client transaction the caller commits —
// this function does not BEGIN/COMMIT itself, so multiple postings (e.g.
// wager then win) can share one atomic transaction.
export async function postLedgerEntry(
  client: DbClient,
  params: {
    playerId: string;
    amountMicros: bigint; // positive = credit to player, negative = debit from player
    reason: LedgerReason;
    roundId?: string;
  },
): Promise<void> {
  const transactionId = randomUUID();
  await client.query(
    `INSERT INTO ledger_entries (transaction_id, account_type, player_id, amount_micros, reason, round_id)
     VALUES ($1, 'player', $2, $3, $4, $5)`,
    [transactionId, params.playerId, params.amountMicros, params.reason, params.roundId ?? null],
  );
  await client.query(
    `INSERT INTO ledger_entries (transaction_id, account_type, player_id, amount_micros, reason, round_id)
     VALUES ($1, 'house', NULL, $2, $3, $4)`,
    [transactionId, -params.amountMicros, params.reason, params.roundId ?? null],
  );
}

export async function getBalanceMicros(client: DbClient, playerId: string): Promise<bigint> {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(amount_micros), 0) AS balance
     FROM ledger_entries
     WHERE account_type = 'player' AND player_id = $1`,
    [playerId],
  );
  return BigInt(rows[0].balance);
}
