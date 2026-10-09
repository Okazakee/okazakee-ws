import { describe, expect, it } from 'vitest';
import { sortSkillsByPosition } from './skillOrder';

type Row = { id: number; position: number | null };

const ids = (rows: Row[]) => rows.map((row) => row.id);

describe('sortSkillsByPosition', () => {
  it('orders by ascending position', () => {
    const rows: Row[] = [
      { id: 1, position: 2 },
      { id: 2, position: 0 },
      { id: 3, position: 1 },
    ];

    expect(ids(sortSkillsByPosition(rows))).toEqual([2, 3, 1]);
  });

  it('puts unpositioned rows last and keeps them in id order', () => {
    const rows: Row[] = [
      { id: 7, position: null },
      { id: 4, position: 0 },
      { id: 9, position: null },
      { id: 2, position: 1 },
    ];

    expect(ids(sortSkillsByPosition(rows))).toEqual([4, 2, 7, 9]);
  });

  it('breaks ties on equal positions by id, deterministically', () => {
    const rows: Row[] = [
      { id: 5, position: 0 },
      { id: 3, position: 0 },
      { id: 4, position: 0 },
    ];

    expect(ids(sortSkillsByPosition(rows))).toEqual([3, 4, 5]);
    expect(ids(sortSkillsByPosition([...rows].reverse()))).toEqual([3, 4, 5]);
  });

  it('never mutates the input array', () => {
    const rows: Row[] = [
      { id: 1, position: 1 },
      { id: 2, position: 0 },
    ];

    sortSkillsByPosition(rows);

    expect(ids(rows)).toEqual([1, 2]);
  });
});
