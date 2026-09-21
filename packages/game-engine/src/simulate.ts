import { secureRandomInt } from './rng.js';
import { generateGrid } from './grid.js';
import { resolveSpin } from './tumble.js';
import { defaultGameConfig } from './config.js';
import type { GameConfig } from './config.js';

export interface SimulationResult {
  spins: number;
  totalWagered: number;
  totalWon: number;
  rtp: number;
  freeSpinsTriggered: number;
}

// Base-game RTP only — the free-spins round and wheel-multiplier finale
// aren't wired into resolveSpin yet (see wheel.ts), so this understates
// true RTP until that's simulated too. Don't treat this number as the
// real RTP target check until free spins are included.
export function runSimulation(
  spins: number,
  betPerSpin = 1,
  config: GameConfig = defaultGameConfig,
): SimulationResult {
  let totalWon = 0;
  let freeSpinsTriggered = 0;

  for (let i = 0; i < spins; i += 1) {
    const grid = generateGrid(config.rows, config.cols, config.symbolWeights, secureRandomInt);
    const result = resolveSpin(grid, config, secureRandomInt);
    totalWon += result.totalWinMultiplier * betPerSpin;
    if (result.freeSpinsTriggered) freeSpinsTriggered += 1;
  }

  const totalWagered = spins * betPerSpin;
  return {
    spins,
    totalWagered,
    totalWon,
    rtp: totalWon / totalWagered,
    freeSpinsTriggered,
  };
}
