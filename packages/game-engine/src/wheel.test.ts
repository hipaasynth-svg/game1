import { describe, expect, it } from 'vitest';
import { spinWheel } from './wheel.js';
import type { WheelSegment } from './config.js';
import type { RandomInt } from './types.js';

const segments: WheelSegment[] = [
  { multiplier: 2, weight: 40 },
  { multiplier: 3, weight: 25 },
  { multiplier: 100, weight: 1 },
];
// Cumulative weight ranges: 2x -> [0,40), 3x -> [40,65), 100x -> [65,66).

function fixed(roll: number): RandomInt {
  return () => roll;
}

describe('spinWheel', () => {
  it('picks the first segment at the low boundary', () => {
    expect(spinWheel(segments, fixed(0))).toBe(2);
  });

  it('picks the segment a roll falls into, not just the first', () => {
    expect(spinWheel(segments, fixed(39))).toBe(2);
    expect(spinWheel(segments, fixed(40))).toBe(3);
    expect(spinWheel(segments, fixed(64))).toBe(3);
  });

  it('picks the last segment at the top of the range', () => {
    expect(spinWheel(segments, fixed(65))).toBe(100);
  });
});
