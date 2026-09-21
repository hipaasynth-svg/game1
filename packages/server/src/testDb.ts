import { createPool } from './db.js';
import { runMigrations } from './migrate.js';

// Tests run against a real Postgres database (see docs/GAME_PLAN.md — the
// server's non-negotiable is a real, auditable ledger, so the ledger
// invariants that matter — locking, atomicity, the zero-sum check — are
// only actually verified by hitting real Postgres, not a mock.
export function testDatabaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL ??
    'postgresql://game1:game1_dev_password@localhost:5432/game1_test'
  );
}

export async function setupTestDb() {
  const connectionString = testDatabaseUrl();
  await runMigrations(connectionString);
  const pool = createPool(connectionString);
  return pool;
}

export async function truncateAll(pool: Awaited<ReturnType<typeof setupTestDb>>) {
  await pool.query('TRUNCATE ledger_entries, spin_rounds, players RESTART IDENTITY CASCADE');
}
