// Fixed-point integer money, never floats — 1 GC = 1,000,000 micros. Same
// pattern Stripe/Google Pay APIs use, and for the same reason: float
// arithmetic on money silently drifts and eventually fails a ledger's
// zero-sum invariant.
export const MICROS_PER_GC = 1_000_000;

export function gcToMicros(gc: number): bigint {
  if (!Number.isFinite(gc) || gc < 0) throw new Error('gcToMicros: gc must be a non-negative number');
  return BigInt(Math.round(gc * MICROS_PER_GC));
}

export function microsToGc(micros: bigint): number {
  return Number(micros) / MICROS_PER_GC;
}

// Rounds a multiplier win (e.g. RoundResult.totalWinMultiplier from
// @game1/game-engine) against a bet already in micros, staying in integer
// arithmetic throughout rather than multiplying floats.
export function applyMultiplier(betMicros: bigint, multiplier: number): bigint {
  if (!Number.isFinite(multiplier) || multiplier < 0) {
    throw new Error('applyMultiplier: multiplier must be a non-negative number');
  }
  return BigInt(Math.round(Number(betMicros) * multiplier));
}
