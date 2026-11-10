import { describe, expect, it } from 'vitest';
import { insert23, delete23, search23, keys23, validate23, clone23, type TwoThreeNode } from './two-three';
import { insertRB, deleteRB, searchRB, keysRB, validateRB, cloneRB, renderRB, type RBNode } from './red-black';
import { layout } from './layout';
import { render23 } from './two-three';

const ascending = Array.from({ length: 60 }, (_, i) => i + 1);
let seed = 73;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const shuffled = [...ascending].sort(() => random() - .5);
describe('2–3 invariants', () => {
  for (const [name, values] of [['ascending', ascending], ['descending', [...ascending].reverse()], ['random', shuffled]] as const) {
    it(`preserves sorted unique keys, node capacity, child counts and equal leaf depths through ${name} insert/delete`, () => {
      let root: TwoThreeNode | null = null;
      const set = new Set<number>();
      for (const value of values) { root = insert23(root, [value]).after; set.add(value); expect(validate23(root)).toEqual([]); expect(keys23(root)).toEqual([...set].sort((a,b) => a-b)); }
      for (const value of shuffled) { root = delete23(root, value).after; set.delete(value); expect(validate23(root)).toEqual([]); expect(keys23(root)).toEqual([...set].sort((a,b) => a-b)); }
      expect(root).toBeNull();
    });
  }
  it('borrows and merges rather than rebuilding', () => {
    const borrow = delete23(insert23(null, [10,20,30,40]).after, 10);
    expect(borrow.after?.keys).toEqual([30]); expect(borrow.after?.children.map(n=>n.keys)).toEqual([[20],[40]]);
    const merge = delete23(insert23(null, [10,20,30]).after, 10);
    expect(merge.after?.keys).toEqual([20,30]); expect(merge.after?.children).toEqual([]);
  });
  it('preserves snapshots, ignores duplicates and searches without edits', () => {
    const op = insert23(null, [10,20,30,40,50,60,70]); const copies = op.frames.map(f => clone23(f.tree));
    delete23(op.after, 40); expect(op.frames.map(f=>f.tree)).toEqual(copies);
    expect(keys23(insert23(op.after, [10]).after)).toEqual([10,20,30,40,50,60,70]);
    const search = search23(op.after, 70); expect(search.after).toEqual(op.after); expect(search.frames.at(-1)?.focus).not.toBeNull();
    expect(validate23(delete23(null, 5).after)).toEqual([]);
  });
});
describe('Red-Black invariants', () => {
  for (const [name, values] of [['ascending', ascending], ['descending', [...ascending].reverse()], ['random', shuffled]] as const) {
    it(`preserves ordering, black root, colors, red edges, black height and parent pointers through ${name} insert/delete`, () => {
      let root: RBNode | null = null; const set = new Set<number>();
      for (const value of values) { root = insertRB(root, [value]).after; set.add(value); expect(validateRB(root)).toEqual([]); expect(keysRB(root)).toEqual([...set].sort((a,b)=>a-b)); }
      for (const value of shuffled) { root = deleteRB(root, value).after; set.delete(value); expect(validateRB(root)).toEqual([]); expect(keysRB(root)).toEqual([...set].sort((a,b)=>a-b)); }
      expect(root).toBeNull();
    });
  }
  it('handles all eight mirrored deletion fix-up branches', () => {
    const fixtures: [number[], number, number[]][] = [
      [[2,6,1,5,3,4],1,[5,8]], [[5,2,1,4,3,6],1,[5,6]], [[4,2,1,3],1,[7,8]], [[2,3,1,4],1,[8]],
      [[2,6,5,1,4,3],6,[5,8]], [[6,1,5,3,4,2],6,[5,6]], [[4,3,1,2],4,[7,8]], [[2,4,3,1],4,[8]],
    ];
    for (const [values, key, cases] of fixtures) {
      const op = deleteRB(insertRB(null, values).after, key);
      expect(validateRB(op.after)).toEqual([]);
      for (const line of cases) expect(op.frames.some(f => f.line === line)).toBe(true);
    }
  });
  it('preserves BST ordering at every rotation and freezes exact color/parent snapshots', () => {
    const op = insertRB(null, ascending); const copies = op.frames.map(f=>cloneRB(f.tree));
    for (const f of op.frames) { const keys = keysRB(f.tree); expect(keys).toEqual([...keys].sort((a,b)=>a-b)); }
    deleteRB(op.after, 30); expect(op.frames.map(f=>f.tree)).toEqual(copies);
    expect(keysRB(insertRB(op.after, [10]).after)).toEqual(ascending);
    const search = searchRB(op.after, 40); expect(search.after).toEqual(op.after); expect(search.frames.at(-1)?.focus).not.toBeNull();
    expect(deleteRB(null, 1).after).toBeNull();
  });
});
it('supports mixed edits against a reference set', () => {
  let a: TwoThreeNode | null = null, b: RBNode | null = null; const set = new Set<number>();
  for (let i = 0; i < 250; i++) { const value = Math.floor(random()*80)-40;
    if (random() < .55) { a = insert23(a,[value]).after; b = insertRB(b,[value]).after; set.add(value); }
    else { a = delete23(a,value).after; b = deleteRB(b,value).after; set.delete(value); }
    expect(validate23(a)).toEqual([]); expect(validateRB(b)).toEqual([]);
    expect(keys23(a)).toEqual([...set].sort((x,y)=>x-y)); expect(keysRB(b)).toEqual(keys23(a));
  }
});
it('lays out multi-key nodes without same-level overlaps and retains binary directions', () => {
  const a = layout(render23(insert23(null, ascending.map(k=>k*100000)).after), false);
  for (const n of a.nodes) for (const m of a.nodes) if (n.id !== m.id && n.y === m.y) expect(Math.abs(n.x-m.x)).toBeGreaterThanOrEqual((n.nodeWidth+m.nodeWidth)/2);
  const root = renderRB(insertRB(null,[10,20,30]).after); const b = layout(root,true);
  expect(b.nodes.length).toBe(3); expect(b.width).toBeGreaterThan(0);
});