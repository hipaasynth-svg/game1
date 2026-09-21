import { randomInt } from 'node:crypto';
import type { RandomInt } from './types.js';

// Cryptographically secure, unbiased over the requested range (unlike
// Math.random() or naive modulo). This is the same class of RNG certified
// online casinos actually run in production — see docs/GAME_PLAN.md.
export const secureRandomInt: RandomInt = (maxExclusive: number) => randomInt(maxExclusive);
