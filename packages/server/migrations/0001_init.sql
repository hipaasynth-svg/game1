CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- No auth yet (that's a Phase 2 item per docs/GAME_PLAN.md) — a player row
-- is just an identity to attach a wallet to for the invite-only playtest.
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE spin_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  bet_micros BIGINT NOT NULL CHECK (bet_micros > 0),
  win_micros BIGINT NOT NULL CHECK (win_micros >= 0),
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- True double-entry: every movement posts two rows (one 'player', one
-- 'house') whose amounts sum to zero. Never updated or deleted — a
-- player's balance is always SUM(amount_micros) over their rows, which
-- makes the whole ledger self-auditing (the grand total across every row
-- must always be exactly zero).
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('player', 'house')),
  player_id UUID REFERENCES players(id),
  currency TEXT NOT NULL DEFAULT 'GC',
  amount_micros BIGINT NOT NULL,
  reason TEXT NOT NULL,
  round_id UUID REFERENCES spin_rounds(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (account_type = 'player' AND player_id IS NOT NULL) OR
    (account_type = 'house' AND player_id IS NULL)
  )
);

CREATE INDEX ledger_entries_player_id_idx ON ledger_entries (player_id);
CREATE INDEX ledger_entries_transaction_id_idx ON ledger_entries (transaction_id);
CREATE INDEX spin_rounds_player_id_idx ON spin_rounds (player_id);
