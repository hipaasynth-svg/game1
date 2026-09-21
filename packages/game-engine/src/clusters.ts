import type { ClusterWin, Grid, Position, SymbolId } from './types.js';
import { REGULAR_SYMBOLS, WILD } from './types.js';
import type { PaytableConfig } from './config.js';

function inBounds(grid: Grid, row: number, col: number): boolean {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

function floodFill(
  grid: Grid,
  start: Position,
  target: SymbolId,
  claimed: boolean[][],
): Position[] {
  const stack: Position[] = [start];
  const visited = new Set<string>();
  const cluster: Position[] = [];

  while (stack.length > 0) {
    const pos = stack.pop()!;
    const key = `${pos.row},${pos.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (claimed[pos.row][pos.col]) continue;
    const symbol = grid[pos.row][pos.col];
    if (symbol !== target && symbol !== WILD) continue;

    cluster.push(pos);
    const neighbors: Position[] = [
      { row: pos.row - 1, col: pos.col },
      { row: pos.row + 1, col: pos.col },
      { row: pos.row, col: pos.col - 1 },
      { row: pos.row, col: pos.col + 1 },
    ];
    for (const n of neighbors) {
      if (inBounds(grid, n.row, n.col) && !visited.has(`${n.row},${n.col}`)) {
        stack.push(n);
      }
    }
  }
  return cluster;
}

function tierMultiplier(paytable: PaytableConfig, symbol: SymbolId, size: number): number {
  const tiers = paytable[symbol];
  if (!tiers) return 0;
  let multiplier = 0;
  for (const tier of tiers) {
    if (size >= tier.minSize) multiplier = tier.multiplier;
  }
  return multiplier;
}

/**
 * Finds all paying clusters on the grid. Symbols are evaluated highest-rank
 * first (see REGULAR_SYMBOLS) so a contiguous wild-only patch resolves as
 * the top-paying symbol rather than being split or double-counted, and
 * cells already claimed by a higher-rank cluster can't join a lower one.
 */
export function findClusters(
  grid: Grid,
  paytable: PaytableConfig,
  minClusterSize: number,
): ClusterWin[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const claimed: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const wins: ClusterWin[] = [];

  for (const symbol of REGULAR_SYMBOLS) {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (claimed[row][col]) continue;
        const cell = grid[row][col];
        if (cell !== symbol && cell !== WILD) continue;

        const cluster = floodFill(grid, { row, col }, symbol, claimed);
        if (cluster.length >= minClusterSize) {
          for (const pos of cluster) claimed[pos.row][pos.col] = true;
          wins.push({
            symbol,
            positions: cluster,
            size: cluster.length,
            payoutMultiplier: tierMultiplier(paytable, symbol, cluster.length),
          });
        }
        // Clusters below minClusterSize stay unclaimed so their cells
        // remain eligible for a lower-rank symbol's flood fill.
      }
    }
  }
  return wins;
}
