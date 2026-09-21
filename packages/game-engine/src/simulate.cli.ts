import { runSimulation } from './simulate.js';

const spins = Number(process.argv[2] ?? 100_000);
const result = runSimulation(spins);

console.log(`Spins: ${result.spins}`);
console.log(`RTP (base + free spins + wheel multiplier): ${(result.rtp * 100).toFixed(2)}%`);
console.log(
  `Free spins triggered: ${result.freeSpinsTriggered} (${((result.freeSpinsTriggered / result.spins) * 100).toFixed(2)}%)`,
);
