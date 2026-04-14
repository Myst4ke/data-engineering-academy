import { describe, it, expect } from 'vitest';
import {
  dropDuplicates, sort, deleteColumn, deleteNa, filter,
  join, rename, select, fillNa, concat,
  applyPipeline, tablesEqual,
} from '../index.js';

describe('dropDuplicates', () => {
  it('removes exact duplicate rows', () => {
    const table = [{ a: '1', b: '2' }, { a: '1', b: '2' }, { a: '3', b: '4' }];
    expect(dropDuplicates(table)).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
  });
  it('returns empty for empty table', () => {
    expect(dropDuplicates([])).toEqual([]);
  });
  it('keeps rows that differ by one cell', () => {
    const table = [{ a: '1', b: '2' }, { a: '1', b: '3' }];
    expect(dropDuplicates(table)).toHaveLength(2);
  });
});

describe('sort', () => {
  it('sorts numerically ascending', () => {
    const table = [{ v: '30' }, { v: '5' }, { v: '20' }];
    const result = sort(table, { column: 'v', order: 'asc' });
    expect(result.map(r => r.v)).toEqual(['5', '20', '30']);
  });
  it('sorts descending', () => {
    const table = [{ v: '10' }, { v: '50' }];
    const result = sort(table, { column: 'v', order: 'desc' });
    expect(result[0].v).toBe('50');
  });
  it('sorts strings alphabetically', () => {
    const table = [{ n: 'Charlie' }, { n: 'Alice' }, { n: 'Bob' }];
    const result = sort(table, { column: 'n', order: 'asc' });
    expect(result.map(r => r.n)).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});

describe('deleteColumn', () => {
  it('removes specified column', () => {
    const table = [{ a: '1', b: '2', c: '3' }];
    const result = deleteColumn(table, { column: 'b' });
    expect(result[0]).toEqual({ a: '1', c: '3' });
  });
});

describe('deleteNa', () => {
  it('removes rows with empty strings', () => {
    const table = [{ a: '1', b: '2' }, { a: '', b: '4' }];
    expect(deleteNa(table)).toHaveLength(1);
  });
  it('removes rows with null', () => {
    const table = [{ a: null }];
    expect(deleteNa(table)).toHaveLength(0);
  });
  it('removes rows with whitespace-only strings', () => {
    const table = [{ a: '  ' }];
    expect(deleteNa(table)).toHaveLength(0);
  });
  it('keeps complete rows', () => {
    const table = [{ a: 'x', b: 'y' }];
    expect(deleteNa(table)).toHaveLength(1);
  });
});

describe('filter', () => {
  it('keeps rows matching value', () => {
    const table = [{ t: 'A', v: '1' }, { t: 'B', v: '2' }, { t: 'A', v: '3' }];
    const result = filter(table, { column: 't', value: 'A' });
    expect(result).toHaveLength(2);
    expect(result.every(r => r.t === 'A')).toBe(true);
  });
  it('returns empty if no match', () => {
    const table = [{ t: 'X' }];
    expect(filter(table, { column: 't', value: 'Y' })).toHaveLength(0);
  });
});

describe('join', () => {
  it('joins on common column', () => {
    const t1 = [{ id: '1', a: 'x' }, { id: '2', a: 'y' }];
    const t2 = [{ id: '1', b: 'p' }, { id: '3', b: 'q' }];
    const result = join(t1, t2, { column: 'id' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: '1', a: 'x', b: 'p' });
  });
  it('handles multiple matches', () => {
    const t1 = [{ id: '1', a: 'x' }];
    const t2 = [{ id: '1', b: 'p' }, { id: '1', b: 'q' }];
    expect(join(t1, t2, { column: 'id' })).toHaveLength(2);
  });
});

describe('rename', () => {
  it('renames a column', () => {
    const table = [{ old: 'v1', other: 'v2' }];
    const result = rename(table, { oldName: 'old', newName: 'new' });
    expect(result[0]).toEqual({ new: 'v1', other: 'v2' });
  });
});

describe('select', () => {
  it('keeps only specified columns', () => {
    const table = [{ a: '1', b: '2', c: '3' }];
    const result = select(table, { columns: ['a', 'c'] });
    expect(result[0]).toEqual({ a: '1', c: '3' });
  });
});

describe('fillNa', () => {
  it('fills empty cells with value', () => {
    const table = [{ a: '', b: 'ok' }, { a: 'x', b: '' }];
    const result = fillNa(table, { column: 'a', value: 'filled' });
    expect(result[0].a).toBe('filled');
    expect(result[1].a).toBe('x');
  });
});

describe('concat', () => {
  it('stacks tables vertically', () => {
    const t1 = [{ a: '1' }];
    const t2 = [{ a: '2' }, { a: '3' }];
    expect(concat(t1, t2)).toHaveLength(3);
  });
});

describe('tablesEqual', () => {
  it('returns true for identical tables', () => {
    const t = [{ a: '1', b: '2' }];
    expect(tablesEqual(t, t)).toBe(true);
  });
  it('returns false for different values', () => {
    const t1 = [{ a: '1' }];
    const t2 = [{ a: '2' }];
    expect(tablesEqual(t1, t2)).toBe(false);
  });
  it('handles case-insensitive column names', () => {
    const t1 = [{ Name: 'Alice' }];
    const t2 = [{ name: 'Alice' }];
    expect(tablesEqual(t1, t2)).toBe(true);
  });
  it('returns false for different row counts', () => {
    const t1 = [{ a: '1' }];
    const t2 = [{ a: '1' }, { a: '2' }];
    expect(tablesEqual(t1, t2)).toBe(false);
  });
  it('returns false for different column counts', () => {
    const t1 = [{ a: '1', b: '2' }];
    const t2 = [{ a: '1' }];
    expect(tablesEqual(t1, t2)).toBe(false);
  });
});

describe('applyPipeline', () => {
  it('applies multiple transformations in sequence', () => {
    const input = [
      { name: 'A', type: 'X', val: '10' },
      { name: 'B', type: 'Y', val: '20' },
      { name: 'C', type: 'X', val: '5' },
    ];
    const cards = [
      { type: 'filter', params: { column: 'type', value: 'X' } },
      { type: 'sort', params: { column: 'val', order: 'asc' } },
    ];
    const result = applyPipeline(input, cards);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('C');
    expect(result[1].name).toBe('A');
  });
});
