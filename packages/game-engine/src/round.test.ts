import { describe, expect, it } from 'vitest';
import { playRound } from './round.js';
import type { GameConfig } from './config.js';
import type { RandomInt } from './types.js';

describe('playRound', () => {
  it('skips the free-spins round when the base spin has no scatters', () => {
    const config: GameConfig = {
      rows: 1,
      cols: 1,
      minClusterSize: 2, // unreachable on a 1-cell grid -> base spin never wins
      symbolWeights: [{ symbol: 'moth', weight: 1 }],
      paytable: {},
      cascadeMultiplierSchedule: [1],
      freeSpinsTriggerCount: 1,
      freeSpinsAwarded: 1,
      freeSpinsRetriggerCount: 1,
      freeSpinsRetriggerAwarded: 0,
      wheelSegments: [{ multiplier: 1, weight: 1 }],
    };
    const randomInt: RandomInt = () => 0;

    const result = playRound(config, randomInt);

    expect(result.baseSpin.freeSpinsTriggered).toBe(false);
    expect(result.freeSpins).toBeNull();
    expect(result.totalWinMultiplier).toBe(result.baseSpin.totalWinMultiplier);
  });

  it('runs and includes the free-spins round when the base spin triggers it', () => {
    const config: GameConfig = {
      rows: 3,
      cols: 1,
      minClusterSize: 99, // unreachable -> no cluster wins anywhere in this test
      symbolWeights: [{ symbol: 'web_scatter', weight: 1 }],
      paytable: {},
      cascadeMultiplierSchedule: [1],
      freeSpinsTriggerCount: 3,
      freeSpinsAwarded: 1,
      freeSpinsRetriggerCount: 99, // unreachable -> no retriggers, round ends after 1 spin
      freeSpinsRetriggerAwarded: 0,
      wheelSegments: [{ multiplier: 7, weight: 1 }],
    };
    const randomInt: RandomInt = () => 0;

    const result = playRound(config, randomInt);

    expect(result.baseSpin.freeSpinsTriggered).toBe(true);
    expect(result.freeSpins).not.toBeNull();
    expect(result.totalWinMultiplier).toBe(
      result.baseSpin.totalWinMultiplier + (result.freeSpins?.totalWinMultiplier ?? 0),
    );
  });
});
