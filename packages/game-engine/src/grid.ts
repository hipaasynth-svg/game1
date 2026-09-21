import type { Grid, RandomInt, SymbolId } from './types.js';
import type { SymbolWeight } from './config.js';
import { pickWeighted } from './weighted.js';

function toWeightedItems(weights: SymbolWeight[]) {
  return weights.map((w) => ({ value: w.symbol, weight: w.weight }));
}

export function generateGrid(
  rows: number,
  cols: number,
  weights: SymbolWeight[],
  randomInt: RandomInt,
): Grid {
  const items = toWeightedItems(weights);
  const grid: Grid = [];
  for (let r = 0; r < rows; r += 1) {
    const row: SymbolId[] = [];
    for (let c = 0; c < cols; c += 1) {
      row.push(pickWeighted(items, randomInt));
    }
    grid.push(row);
  }
  return grid;
}

// Gravity + refill: compacts remaining symbols in each column downward and
// drops new symbols in from the top to fill the gaps left by a cleared
// cluster.
export function fillFromTop(
  grid: (SymbolId | null)[][],
  weights: SymbolWeight[],
  randomInt: RandomInt,
): Grid {
  const items = toWeightedItems(weights);
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const result: Grid = Array.from({ length: rows }, () => new Array(cols) as SymbolId[]);

  for (let c = 0; c < cols; c += 1) {
    const surviving: SymbolId[] = [];
    for (let r = 0; r < rows; r += 1) {
      const cell = grid[r][c];
      if (cell !== null) surviving.push(cell);
    }
    const missing = rows - surviving.length;
    const dropped: SymbolId[] = [];
    for (let i = 0; i < missing; i += 1) {
      dropped.push(pickWeighted(items, randomInt));
    }
    const fullColumn = [...dropped, ...surviving];
    for (let r = 0; r < rows; r += 1) {
      result[r][c] = fullColumn[r];
    }
  }
  return result;
}
