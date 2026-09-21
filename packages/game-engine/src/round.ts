import type { RandomInt, SpinResult } from './types.js';
import type { GameConfig } from './config.js';
import { generateGrid } from './grid.js';
import { resolveSpin } from './tumble.js';
import { playFreeSpinsRound, type FreeSpinsRoundResult } from './freeSpins.js';

export interface RoundResult {
  baseSpin: SpinResult;
  freeSpins: FreeSpinsRoundResult | null;
  totalWinMultiplier: number;
}

// Plays one full player-facing round: the base spin, plus a free-spins
// round when the base spin's scatters trigger it. This is the unit both
// the server's spin endpoint and the RTP simulator should call — no max-win
// cap is applied here yet (see docs/GAME_PLAN.md "payout liability" item),
// that belongs above this layer once balancing/finance work sets a number.
export function playRound(config: GameConfig, randomInt: RandomInt): RoundResult {
  const baseGrid = generateGrid(config.rows, config.cols, config.symbolWeights, randomInt);
  const baseSpin = resolveSpin(baseGrid, config, randomInt);
  const freeSpins = baseSpin.freeSpinsTriggered ? playFreeSpinsRound(config, randomInt) : null;
  const totalWinMultiplier = baseSpin.totalWinMultiplier + (freeSpins?.totalWinMultiplier ?? 0);

  return { baseSpin, freeSpins, totalWinMultiplier };
}
