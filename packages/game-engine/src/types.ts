export type SymbolId =
  | 'moth'
  | 'beetle'
  | 'gem_green'
  | 'gem_purple'
  | 'skull'
  | 'spider_wild'
  | 'web_scatter';

export const WILD: SymbolId = 'spider_wild';
export const SCATTER: SymbolId = 'web_scatter';

// Highest-rank first. Cluster detection walks this order so a contiguous
// wild-only patch resolves as the top-paying symbol instead of being split
// or double-counted across ranks — see clusters.ts.
export const REGULAR_SYMBOLS: SymbolId[] = [
  'skull',
  'gem_purple',
  'gem_green',
  'beetle',
  'moth',
];

export type Grid = SymbolId[][];

export interface Position {
  row: number;
  col: number;
}

export interface ClusterWin {
  symbol: SymbolId;
  positions: Position[];
  size: number;
  payoutMultiplier: number;
}

export interface TumbleStep {
  stepIndex: number;
  clusters: ClusterWin[];
  stepMultiplier: number;
  stepWin: number;
  gridBefore: Grid;
}

export interface SpinResult {
  finalGrid: Grid;
  steps: TumbleStep[];
  totalWinMultiplier: number;
  scatterCount: number;
  freeSpinsTriggered: boolean;
}

// Returns an unbiased integer in [0, maxExclusive). Production uses a CSPRNG
// (rng.ts); tests inject a deterministic stub.
export type RandomInt = (maxExclusive: number) => number;
