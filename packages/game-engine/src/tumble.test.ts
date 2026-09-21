import { describe, expect, it } from 'vitest';
import { fillFromTop } from './grid.js';
import { resolveSpin } from './tumble.js';
import type { GameConfig } from './config.js';
import type { Grid, RandomInt, SymbolId } from './types.js';

// Stub that returns a fixed queue of values, one per call, and throws if
// resolveSpin/fillFromTop ever calls it more or fewer times than expected —
// makes the RNG-dependent behavior fully deterministic and self-checking.
function queueRandomInt(queue: number[]): RandomInt {
  const remaining = [...queue];
  return () => {
    const value = remaining.shift();
    if (value === undefined) throw new Error('unexpected extra randomInt call');
    return value;
  };
}

describe('fillFromTop', () => {
  it('compacts surviving symbols to the bottom and drops new ones in from the top', () => {
    const grid: (SymbolId | null)[][] = [
      [null, 'skull'],
      ['moth', null],
      ['beetle', 'gem_green'],
    ];
    // Single-symbol weight table makes the refill deterministic regardless
    // of the roll value.
    const randomInt = queueRandomInt([0, 0]);
    const result = fillFromTop(grid, [{ symbol: 'gem_purple', weight: 1 }], randomInt);

    expect(result).toEqual([
      ['gem_purple', 'gem_purple'],
      ['moth', 'skull'],
      ['beetle', 'gem_green'],
    ]);
  });
});

describe('resolveSpin', () => {
  const config: GameConfig = {
    rows: 3,
    cols: 3,
    minClusterSize: 3,
    symbolWeights: [
      { symbol: 'moth', weight: 1 },
      { symbol: 'beetle', weight: 1 },
    ],
    paytable: {
      moth: [{ minSize: 3, multiplier: 1 }],
      beetle: [{ minSize: 3, multiplier: 1 }],
    },
    cascadeMultiplierSchedule: [1],
    freeSpinsTriggerCount: 99,
    freeSpinsAwarded: 0,
    freeSpinsRetriggerCount: 99,
    freeSpinsRetriggerAwarded: 0,
    wheelSegments: [],
  };

  it('cascades once, then stops naturally once the refill forms no new cluster', () => {
    const grid: Grid = [
      ['moth', 'moth', 'moth'],
      ['skull', 'gem_purple', 'skull'],
      ['gem_purple', 'skull', 'gem_purple'],
    ];
    // pickWeighted([moth(1), beetle(1)]): roll 0 -> moth, roll 1 -> beetle.
    // Refills the cleared top row as moth, beetle, moth — no 3-in-a-row.
    const randomInt = queueRandomInt([0, 1, 0]);

    const result = resolveSpin(grid, config, randomInt);

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].clusters).toEqual([
      {
        symbol: 'moth',
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ],
        size: 3,
        payoutMultiplier: 1,
      },
    ]);
    expect(result.steps[0].stepMultiplier).toBe(1);
    expect(result.steps[0].stepWin).toBe(1);
    expect(result.totalWinMultiplier).toBe(1);
    expect(result.finalGrid).toEqual([
      ['moth', 'beetle', 'moth'],
      ['skull', 'gem_purple', 'skull'],
      ['gem_purple', 'skull', 'gem_purple'],
    ]);
    expect(result.scatterCount).toBe(0);
    expect(result.freeSpinsTriggered).toBe(false);
  });

  it('reports no win when the initial grid has no qualifying cluster', () => {
    const grid: Grid = [
      ['moth', 'beetle', 'moth'],
      ['beetle', 'moth', 'beetle'],
      ['moth', 'beetle', 'moth'],
    ];
    const randomInt = queueRandomInt([]);

    const result = resolveSpin(grid, config, randomInt);

    expect(result.steps).toHaveLength(0);
    expect(result.totalWinMultiplier).toBe(0);
    expect(result.finalGrid).toEqual(grid);
  });
});
