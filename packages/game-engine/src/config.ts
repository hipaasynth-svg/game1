import type { SymbolId } from './types.js';

export interface PaytableTier {
  minSize: number;
  multiplier: number;
}

export type PaytableConfig = Partial<Record<SymbolId, PaytableTier[]>>;

export interface SymbolWeight {
  symbol: SymbolId;
  weight: number;
}

export interface WheelSegment {
  multiplier: number;
  weight: number;
}

export interface GameConfig {
  rows: number;
  cols: number;
  minClusterSize: number;
  symbolWeights: SymbolWeight[];
  paytable: PaytableConfig;
  cascadeMultiplierSchedule: number[];
  freeSpinsTriggerCount: number;
  freeSpinsAwarded: number;
  // A retrigger during the free-spins round needs its own (typically lower)
  // scatter threshold and award count — see freeSpins.ts.
  freeSpinsRetriggerCount: number;
  freeSpinsRetriggerAwarded: number;
  wheelSegments: WheelSegment[];
}

// Placeholder v1 numbers, NOT yet balanced against the 95% RTP target in
// docs/GAME_PLAN.md. Run `npm run simulate -w @game1/game-engine` and tune
// weights/paytable/schedule before this config is used for real money.
export const defaultGameConfig: GameConfig = {
  rows: 5,
  cols: 5,
  minClusterSize: 5,
  symbolWeights: [
    { symbol: 'moth', weight: 26 },
    { symbol: 'beetle', weight: 22 },
    { symbol: 'gem_green', weight: 18 },
    { symbol: 'gem_purple', weight: 14 },
    { symbol: 'skull', weight: 10 },
    { symbol: 'spider_wild', weight: 6 },
    { symbol: 'web_scatter', weight: 4 },
  ],
  paytable: {
    moth: [
      { minSize: 5, multiplier: 0.1 },
      { minSize: 8, multiplier: 0.25 },
      { minSize: 11, multiplier: 0.5 },
    ],
    beetle: [
      { minSize: 5, multiplier: 0.15 },
      { minSize: 8, multiplier: 0.35 },
      { minSize: 11, multiplier: 0.75 },
    ],
    gem_green: [
      { minSize: 5, multiplier: 0.25 },
      { minSize: 8, multiplier: 0.6 },
      { minSize: 11, multiplier: 1.5 },
    ],
    gem_purple: [
      { minSize: 5, multiplier: 0.4 },
      { minSize: 8, multiplier: 1.0 },
      { minSize: 11, multiplier: 2.5 },
    ],
    skull: [
      { minSize: 5, multiplier: 0.75 },
      { minSize: 8, multiplier: 2.0 },
      { minSize: 11, multiplier: 5.0 },
    ],
  },
  cascadeMultiplierSchedule: [1, 2, 3, 5, 8, 13],
  freeSpinsTriggerCount: 4,
  freeSpinsAwarded: 10,
  freeSpinsRetriggerCount: 3,
  freeSpinsRetriggerAwarded: 5,
  wheelSegments: [
    { multiplier: 2, weight: 40 },
    { multiplier: 3, weight: 25 },
    { multiplier: 5, weight: 15 },
    { multiplier: 10, weight: 10 },
    { multiplier: 25, weight: 6 },
    { multiplier: 50, weight: 3 },
    { multiplier: 100, weight: 1 },
  ],
};
