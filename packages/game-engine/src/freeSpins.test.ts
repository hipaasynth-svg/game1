import { describe, expect, it } from 'vitest';
import { playFreeSpinsRound } from './freeSpins.js';
import type { GameConfig } from './config.js';
import type { RandomInt } from './types.js';

function queueRandomInt(queue: number[]): RandomInt {
  const remaining = [...queue];
  return () => {
    const value = remaining.shift();
    if (value === undefined) throw new Error('unexpected extra randomInt call');
    return value;
  };
}

describe('playFreeSpinsRound', () => {
  it('caps a runaway retrigger loop at the internal safety limit', () => {
    // Every cell is a scatter symbol, so every free spin re-triggers
    // (scatterCount is always rows*cols, well above the threshold) and
    // never pays out (scatter never forms a cluster — see clusters.test.ts).
    // This is the pathological case the safety cap exists for.
    const config: GameConfig = {
      rows: 3,
      cols: 3,
      minClusterSize: 3,
      symbolWeights: [{ symbol: 'web_scatter', weight: 1 }],
      paytable: {},
      cascadeMultiplierSchedule: [1],
      freeSpinsTriggerCount: 1,
      freeSpinsAwarded: 1,
      freeSpinsRetriggerCount: 1,
      freeSpinsRetriggerAwarded: 1,
      wheelSegments: [{ multiplier: 1, weight: 1 }],
    };
    // Single-weight symbol/wheel tables make every pick deterministic
    // regardless of roll, so a constant stub is safe here.
    const randomInt: RandomInt = () => 0;

    const result = playFreeSpinsRound(config, randomInt);

    expect(result.spinsPlayed).toBe(500);
    expect(result.retriggers).toBe(500);
    expect(result.spins).toHaveLength(500);
    expect(result.winBeforeWheelMultiplier).toBe(0);
    expect(result.totalWinMultiplier).toBe(0);
  });

  it('multiplies the accumulated win by the wheel result', () => {
    const config: GameConfig = {
      rows: 3,
      cols: 3,
      minClusterSize: 3,
      symbolWeights: [
        { symbol: 'moth', weight: 1 },
        { symbol: 'beetle', weight: 1 },
        { symbol: 'gem_purple', weight: 1 },
        { symbol: 'skull', weight: 1 },
      ],
      paytable: {
        moth: [{ minSize: 3, multiplier: 1 }],
      },
      cascadeMultiplierSchedule: [1],
      freeSpinsTriggerCount: 99,
      freeSpinsAwarded: 1,
      freeSpinsRetriggerCount: 99,
      freeSpinsRetriggerAwarded: 0,
      wheelSegments: [
        { multiplier: 5, weight: 1 },
        { multiplier: 9, weight: 1 },
      ],
    };
    // pickWeighted over [moth, beetle, gem_purple, skull] (each weight 1):
    // roll 0 -> moth, 1 -> beetle, 2 -> gem_purple, 3 -> skull.
    //
    // 9 rolls build the spin's initial 3x3 grid, row-major:
    //   moth  moth  moth
    //   skull gem_purple skull
    //   gem_purple skull gem_purple
    // -> one moth cluster (row 0, size 3, payout 1 x step-mult 1 = 1).
    //
    // Next 3 rolls refill the cleared row 0 as moth, beetle, moth — no new
    // cluster (same pattern verified in tumble.test.ts), so the cascade
    // and the round both end after this one free spin.
    //
    // Final roll spins the wheel: roll 1 -> the second segment (9x).
    const randomInt = queueRandomInt([0, 0, 0, 3, 2, 3, 2, 3, 2, 0, 1, 0, 1]);

    const result = playFreeSpinsRound(config, randomInt);

    expect(result.spinsPlayed).toBe(1);
    expect(result.retriggers).toBe(0);
    expect(result.winBeforeWheelMultiplier).toBe(1);
    expect(result.wheelMultiplier).toBe(9);
    expect(result.totalWinMultiplier).toBe(9);
  });
});
