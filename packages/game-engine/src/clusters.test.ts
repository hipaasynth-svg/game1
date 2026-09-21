import { describe, expect, it } from 'vitest';
import { findClusters } from './clusters.js';
import { defaultGameConfig } from './config.js';
import type { Grid, SymbolId } from './types.js';

const SYMBOL_CHARS: Record<string, SymbolId> = {
  m: 'moth',
  b: 'beetle',
  g: 'gem_green',
  p: 'gem_purple',
  s: 'skull',
  w: 'spider_wild',
  c: 'web_scatter',
};

function grid(rows: string[]): Grid {
  return rows.map((row) => row.split('').map((ch) => SYMBOL_CHARS[ch]));
}

describe('findClusters', () => {
  it('finds one cluster per fully-matching row, size 5 each', () => {
    const g = grid(['mmmmm', 'bbbbb', 'ggggg', 'ppppp', 'sssss']);
    const wins = findClusters(g, defaultGameConfig.paytable, 5);
    expect(wins).toHaveLength(5);
    for (const win of wins) {
      expect(win.size).toBe(5);
    }
  });

  it('lets a wild substitute into an adjacent cluster', () => {
    // Rows 1-4 are a cyclic skull/green/purple pattern with no run of its
    // own (see the "smaller than minClusterSize" case below) — this keeps
    // the wild's only path to a higher-rank symbol (skull, via row 1 col 3)
    // capped at 2 cells, so it stays unclaimed until moth's turn.
    const g = grid(['mmmwm', 'sgpsg', 'psgps', 'gpsgp', 'sgpsg']);
    const wins = findClusters(g, defaultGameConfig.paytable, 5);
    const mothWin = wins.find((w) => w.symbol === 'moth');
    expect(mothWin).toBeDefined();
    expect(mothWin?.size).toBe(5);
  });

  it('does not count a cluster smaller than minClusterSize', () => {
    const g = grid(['mmbbb', 'sgpsg', 'psgps', 'gpsgp', 'sgpsg']);
    const wins = findClusters(g, defaultGameConfig.paytable, 5);
    expect(wins.find((w) => w.symbol === 'moth')).toBeUndefined();
  });

  it('does not connect symbols that only touch diagonally', () => {
    const g = grid(['mbmbm', 'bmbmb', 'mbmbm', 'bmbmb', 'mbmbm']);
    const wins = findClusters(g, defaultGameConfig.paytable, 5);
    expect(wins).toHaveLength(0);
  });

  it('never pays out scatter symbols, however many land', () => {
    const g = grid(['ccccc', 'ccccc', 'ccccc', 'ccccc', 'ccccc']);
    const wins = findClusters(g, defaultGameConfig.paytable, 5);
    expect(wins).toHaveLength(0);
  });
});
