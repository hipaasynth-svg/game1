import type { Grid, RandomInt, SpinResult, SymbolId, TumbleStep } from './types.js';
import { SCATTER } from './types.js';
import type { GameConfig } from './config.js';
import { findClusters } from './clusters.js';
import { fillFromTop } from './grid.js';

// Safety cap only — a well-tuned paytable/weight table should never come
// close to this. Prevents a runaway loop if a config change accidentally
// makes the grid self-sustain forever.
const MAX_CASCADE_STEPS = 50;

function countScatters(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === SCATTER) count += 1;
    }
  }
  return count;
}

function stepMultiplierFor(stepIndex: number, schedule: number[]): number {
  return schedule[Math.min(stepIndex, schedule.length - 1)];
}

// Resolves one full spin: repeatedly finds paying clusters, clears them,
// drops the remaining symbols, and refills from the top, until a step
// produces no more wins. The free-spins scatter count is read off the
// initial grid only, not cascade-added scatters — keeps v1 scope simple.
export function resolveSpin(initialGrid: Grid, config: GameConfig, randomInt: RandomInt): SpinResult {
  let grid = initialGrid;
  const steps: TumbleStep[] = [];
  let totalWinMultiplier = 0;
  let stepIndex = 0;

  while (stepIndex < MAX_CASCADE_STEPS) {
    const clusters = findClusters(grid, config.paytable, config.minClusterSize);
    if (clusters.length === 0) break;

    const stepMultiplier = stepMultiplierFor(stepIndex, config.cascadeMultiplierSchedule);
    const stepWin = clusters.reduce((sum, c) => sum + c.payoutMultiplier, 0) * stepMultiplier;
    steps.push({ stepIndex, clusters, stepMultiplier, stepWin, gridBefore: grid });
    totalWinMultiplier += stepWin;

    const cleared: (SymbolId | null)[][] = grid.map((row) => [...row]);
    for (const cluster of clusters) {
      for (const pos of cluster.positions) cleared[pos.row][pos.col] = null;
    }
    grid = fillFromTop(cleared, config.symbolWeights, randomInt);
    stepIndex += 1;
  }

  const scatterCount = countScatters(initialGrid);
  return {
    finalGrid: grid,
    steps,
    totalWinMultiplier,
    scatterCount,
    freeSpinsTriggered: scatterCount >= config.freeSpinsTriggerCount,
  };
}
