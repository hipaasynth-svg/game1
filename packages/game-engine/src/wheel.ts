import type { RandomInt } from './types.js';
import type { WheelSegment } from './config.js';
import { pickWeighted } from './weighted.js';

// The free-spins finale multiplier wheel (docs/GAME_PLAN.md section 3).
// Not yet wired into resolveSpin — that belongs to the free-spins round
// orchestrator, which lives above this framework-agnostic engine.
export function spinWheel(segments: WheelSegment[], randomInt: RandomInt): number {
  return pickWeighted(
    segments.map((s) => ({ value: s.multiplier, weight: s.weight })),
    randomInt,
  );
}
