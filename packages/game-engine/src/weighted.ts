import type { RandomInt } from './types.js';

export interface WeightedItem<T> {
  value: T;
  weight: number;
}

export function pickWeighted<T>(items: WeightedItem<T>[], randomInt: RandomInt): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('pickWeighted: total weight must be positive');
  }
  let roll = randomInt(totalWeight);
  for (const item of items) {
    if (roll < item.weight) return item.value;
    roll -= item.weight;
  }
  // Unreachable if weights are well-formed; guards against float/int drift.
  return items[items.length - 1].value;
}
