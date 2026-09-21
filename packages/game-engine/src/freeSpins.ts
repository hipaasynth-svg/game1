import type { RandomInt, SpinResult } from './types.js';
import type { GameConfig } from './config.js';
import { generateGrid } from './grid.js';
import { resolveSpin } from './tumble.js';
import { spinWheel } from './wheel.js';

// Safety cap against a misconfigured retrigger threshold (e.g. 0) that
// would otherwise loop forever. A balanced config should never come close.
const MAX_FREE_SPINS = 500;

export interface FreeSpinsRoundResult {
  spinsPlayed: number;
  retriggers: number;
  spins: SpinResult[];
  winBeforeWheelMultiplier: number;
  wheelMultiplier: number;
  totalWinMultiplier: number;
}

// Plays a full free-spins round: config.freeSpinsAwarded spins, each able
// to retrigger more spins via config.freeSpinsRetriggerCount/Awarded, then
// one wheel spin (docs/GAME_PLAN.md section 3) whose multiplier applies to
// the round's accumulated win.
export function playFreeSpinsRound(config: GameConfig, randomInt: RandomInt): FreeSpinsRoundResult {
  let remaining = config.freeSpinsAwarded;
  let spinsPlayed = 0;
  let retriggers = 0;
  const spins: SpinResult[] = [];
  let winBeforeWheelMultiplier = 0;

  while (remaining > 0 && spinsPlayed < MAX_FREE_SPINS) {
    const grid = generateGrid(config.rows, config.cols, config.symbolWeights, randomInt);
    const result = resolveSpin(grid, config, randomInt);
    spins.push(result);
    winBeforeWheelMultiplier += result.totalWinMultiplier;
    spinsPlayed += 1;
    remaining -= 1;

    if (result.scatterCount >= config.freeSpinsRetriggerCount) {
      remaining += config.freeSpinsRetriggerAwarded;
      retriggers += 1;
    }
  }

  const wheelMultiplier = spinWheel(config.wheelSegments, randomInt);
  const totalWinMultiplier = winBeforeWheelMultiplier * wheelMultiplier;

  return { spinsPlayed, retriggers, spins, winBeforeWheelMultiplier, wheelMultiplier, totalWinMultiplier };
}
