import { secureRandomInt } from './rng.js';
import { playRound } from './round.js';
import { defaultGameConfig } from './config.js';
import type { GameConfig } from './config.js';

export interface SimulationResult {
  spins: number;
  totalWagered: number;
  totalWon: number;
  rtp: number;
  freeSpinsTriggered: number;
}

// Full-round RTP: base spin plus, when triggered, the free-spins round and
// its wheel-multiplier finale. This is the number to check against the 95%
// target in docs/GAME_PLAN.md — tune symbolWeights/paytable/schedule/
// wheelSegments in config.ts and re-run until it converges there.
export function runSimulation(
  spins: number,
  betPerSpin = 1,
  config: GameConfig = defaultGameConfig,
): SimulationResult {
  let totalWon = 0;
  let freeSpinsTriggered = 0;

  for (let i = 0; i < spins; i += 1) {
    const round = playRound(config, secureRandomInt);
    totalWon += round.totalWinMultiplier * betPerSpin;
    if (round.freeSpins) freeSpinsTriggered += 1;
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
