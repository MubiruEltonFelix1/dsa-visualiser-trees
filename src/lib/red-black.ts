import type { RNode } from './traversal';
import type { AdvancedAdapter, TreeOperation, TreeExample } from './tree-operation';
export type Color = 'RED' | 'BLACK';
export interface RBNode { id: number; key: number; color: Color; left: RBNode | null; right: RBNode | null; parent: RBNode | null }
let nextId = 1;
export function cloneRB(n: RBNode | null, parent: RBNode | null = null): RBNode | null {
  if (!n || n.id === 0) return null;
  const c: RBNode = { id: n.id, key: n.key, color: n.color, left: null, right: null, parent };
  c.left = cloneRB(n.left, c); c.right = cloneRB(n.right, c); return c;
}
export const keysRB = (n: RBNode | null): number[] => n ? [...keysRB(n.left), n.key, ...keysRB(n.right)] : [];
export function validateRB(root: RBNode | null): string[] {
  const errors: string[] = [];
  if (root?.color === 'RED') errors.push('Root must be black.');
  const walk = (n: RBNode | null, parent: RBNode | null, low: number, high: number): number => {
    if (!n) return 1;
    if (n.parent !== parent) errors.push('Parent pointer is incorrect.');
    if (!(n.key > low && n.key < high)) errors.push('Strict BST ordering violated.');
    if (n.color !== 'RED' && n.color !== 'BLACK') errors.push('Invalid color.');
    if (n.color === 'RED' && (n.left?.color === 'RED' || n.right?.color === 'RED')) errors.push('Red node has red child.');
    const l = walk(n.left, n, low, n.key), r = walk(n.right, n, n.key, high);
    if (l !== r) errors.push('Black heights differ.');
    return l + (n.color === 'BLACK' ? 1 : 0);
  };
  walk(root, null, -Infinity, Infinity); return errors;
}
function operationRB(input: RBNode | null, values: number[], kind: TreeOperation<RBNode>['kind']): TreeOperation<RBNode> {
  const nil: RBNode = { id: 0, key: 0, color: 'BLACK', left: null, right: null, parent: null };
  nil.left = nil; nil.right = nil; nil.parent = nil;
  let root = cloneRB(input) ?? nil;
  const prepare = (n: RBNode) => { n.left = n.left ?? nil; n.right = n.right ?? nil; if (n.left !== nil) prepare(n.left); if (n.right !== nil) prepare(n.right); };
  if (root !== nil) { root.parent = nil; prepare(root); }
  const op: TreeOperation<RBNode> = { label: `${kind === 'insert' ? 'Insert' : kind === 'delete' ? 'Delete' : 'Search'} ${values.join(', ')}`, kind, after: null, frames: [], rotations: 0, recolors: 0 };
  let path: number[] = [];
  const color = (n: RBNode | null) => n?.color ?? 'BLACK';
  const paint = (n: RBNode | null, c: Color) => { if (n && n !== nil && n.color !== c) { n.color = c; op.recolors++; } };
  const record = (title: string, note: string, line: number, n: RBNode = nil, context?: Record<string, number | null>, property = 'Restore a black root, no red-red edges, and equal root-to-NIL black heights.') => {
    op.frames.push({ tree: cloneRB(root), title, note, line, focus: n === nil ? null : n.id, path: [...path], property, rotations: op.rotations, recolors: op.recolors, ...(context ? { context } : {}) });
  };
  const rotate = (x: RBNode, dir: 'left' | 'right', line: number) => {
    const y = dir === 'left' ? x.right : x.left; if (!y || y === nil) return;
    if (dir === 'left') { x.right = y.left; if (y.left && y.left !== nil) y.left.parent = x; }
    else { x.left = y.right; if (y.right && y.right !== nil) y.right.parent = x; }
    y.parent = x.parent;
    if (x.parent === nil || !x.parent) root = y;
    else if (x === x.parent.left) x.parent.left = y; else x.parent.right = y;
    if (dir === 'left') y.left = x; else y.right = x;
    x.parent = y; op.rotations++;
    record(`${dir === 'left' ? 'Left' : 'Right'} rotation`, `Promote ${y.key} above ${x.key}; subtree ranges and BST order stay unchanged.`, line, y);
  };
  const locate = (v: number) => {
    let n = root; path = [];
    while (n !== nil) {
      path.push(n.id); record('Compare key', `Compare ${v} with ${n.key}; go ${v < n.key ? 'left' : v > n.key ? 'right' : 'no further'}.`, 1, n, undefined, 'Search follows the strict BST ordering.');
      if (v === n.key) return n;
      n = (v < n.key ? n.left : n.right) ?? nil;
    }
    return nil;
  };
  record('Before operation', 'Start with the current Red-Black tree. NIL leaves are black.', 0);
  const insertFix = (start: RBNode) => {
    let z = start;
    while (z.parent?.color === 'RED') {
      const p = z.parent, g = p.parent; if (!g || g === nil) break;
      const left = p === g.left, uncle = (left ? g.right : g.left) ?? nil;
      const context = { node: z.key, parent: p.key, grandparent: g.key, uncle: uncle === nil ? null : uncle.key };
      record('Inspect parent, grandparent, uncle', `Red parent ${p.key} creates a red-red edge. Uncle is ${uncle === nil ? 'black NIL' : `${uncle.key} (${uncle.color})`}.`, 3, z, context);
      if (uncle.color === 'RED') {
        paint(p, 'BLACK'); paint(uncle, 'BLACK'); paint(g, 'RED');
        record('Uncle red: recolor', 'Make parent and uncle black, grandparent red. Black height is preserved; continue at grandparent.', 4, g, context); z = g;
      } else {
        if (z === (left ? p.right : p.left)) {
          z = p; record('Inner child: straighten', 'Rotate the parent to turn the triangle into an outer-child line.', 5, p, context); rotate(z, left ? 'left' : 'right', 5);
        }
        const parent = z.parent, grand = parent?.parent; if (!parent || !grand || grand === nil) break;
        paint(parent, 'BLACK'); paint(grand, 'RED'); record('Outer child: recolor', 'Promoted parent becomes black and grandparent red before the final rotation.', 6, parent, context);
        rotate(grand, left ? 'right' : 'left', 6);
      }
    }
    paint(root, 'BLACK'); record('Blacken root', 'The root is black; every red node has black children and all NIL paths have equal black height.', 7, root);
  };
  const transplant = (u: RBNode, v: RBNode) => {
    if (u.parent === nil || !u.parent) root = v;
    else if (u === u.parent.left) u.parent.left = v; else u.parent.right = v;
    v.parent = u.parent;
  };
  const deleteFix = (start: RBNode) => {
    let x = start;
    while (x !== root && x.color === 'BLACK') {
      const p = x.parent; if (!p || p === nil) break;
      const left = x === p.left;
      let w = (left ? p.right : p.left) ?? nil;
      const context = () => ({ parent: p.key, sibling: w === nil ? null : w.key, deficient: x === nil ? null : x.key });
      record(`Black deficit (${left ? 'left' : 'right'})`, 'Removing a black node leaves this branch one black short. Inspect its sibling.', 4, p, context());
      if (w.color === 'RED') {
        paint(w, 'BLACK'); paint(p, 'RED'); record('Case 1: red sibling', 'Recolor sibling black and parent red; rotate parent to obtain a black sibling.', 5, w, context());
        rotate(p, left ? 'left' : 'right', 5); w = (left ? p.right : p.left) ?? nil;
      }
      const near = () => left ? w.left : w.right;
      const far = () => left ? w.right : w.left;
      if (color(near()) === 'BLACK' && color(far()) === 'BLACK') {
        paint(w, 'RED'); record('Case 2: black sibling, black children', 'Recolor sibling red; move the black deficit up to the parent.', 6, p, context()); x = p;
      } else {
        if (color(far()) === 'BLACK') {
          paint(near(), 'BLACK'); paint(w, 'RED'); record('Case 3: near red child', 'Make near child black, sibling red; rotate sibling so its far child becomes red.', 7, w, context());
          rotate(w, left ? 'right' : 'left', 7); w = (left ? p.right : p.left) ?? nil;
        }
        paint(w, p.color); paint(p, 'BLACK'); paint(left ? w.right : w.left, 'BLACK');
        record('Case 4: far red child', 'Transfer parent color to sibling and blacken parent and far child. Rotate to absorb the black deficit.', 8, w, context());
        rotate(p, left ? 'left' : 'right', 8); x = root;
      }
    }
    paint(x, 'BLACK'); record('Black deficit resolved', 'Blacken the replacement (or root). Equal black heights and no red-red edges are restored.', 9, x);
  };
  for (const v of values) {
    const found = locate(v);
    if (kind === 'search') { record(found !== nil ? 'Key found' : 'Key not found', found !== nil ? `${v} is present.` : `${v} is absent; search reached a black NIL leaf.`, 2, found); continue; }
    if (kind === 'insert') {
      if (found !== nil) { record('Duplicate ignored', `${v} already exists; no key is added.`, 8, found); continue; }
      let p = nil, n = root;
      while (n !== nil) { p = n; n = (v < n.key ? n.left : n.right) ?? nil; }
      const z: RBNode = { id: nextId++, key: v, color: 'RED', parent: p, left: nil, right: nil };
      if (p === nil) root = z; else if (v < p.key) p.left = z; else p.right = z;
      record('Insert red BST leaf', `${v} enters as red so existing path black heights do not increase.`, 2, z); insertFix(z);
    } else if (found !== nil) {
      const z = found; let y = z, original = y.color, x: RBNode;
      if (z.left === nil || !z.left) { x = z.right ?? nil; transplant(z, x); }
      else if (z.right === nil || !z.right) { x = z.left; transplant(z, x); }
      else {
        y = z.right; while (y.left && y.left !== nil) y = y.left;
        original = y.color; x = y.right ?? nil;
        record('Successor replacement', `Successor ${y.key} replaces ${z.key}; repair depends on the successor’s original ${original.toLowerCase()} color.`, 2, y);
        if (y.parent === z) x.parent = y;
        else { transplant(y, x); y.right = z.right; if (y.right) y.right.parent = y; }
        transplant(z, y); y.left = z.left; if (y.left) y.left.parent = y; paint(y, z.color);
      }
      record('Remove node', `Delete ${v}. ${original === 'BLACK' ? 'The removed black needs a deficit fix-up.' : 'Removing red does not change black height.'}`, 3, x);
      if (original === 'BLACK') deleteFix(x);
    } else record('Key not found', `${v} is absent; the tree is unchanged.`, 10);
    path = []; record('Operation complete', 'All five Red-Black properties hold, including black NIL leaves.', kind === 'insert' ? 8 : 10);
  }
  op.after = cloneRB(root); return op;
}
export const insertRB = (root: RBNode | null, values: number[]) => operationRB(root, values, 'insert');
export const deleteRB = (root: RBNode | null, value: number) => operationRB(root, [value], 'delete');
export const searchRB = (root: RBNode | null, value: number) => operationRB(root, [value], 'search');
export const renderRB = (n: RBNode | null): RNode | null => n ? { id: n.id, label: String(n.key), color: n.color, kids: [renderRB(n.left), renderRB(n.right)] } : null;
export const EXAMPLES_RB: TreeExample[] = [
  { label: 'Simple insertion', values: [10, 5] }, { label: 'Recoloring', values: [10, 5, 15, 1] },
  { label: 'Left rotation', values: [10, 20, 30] }, { label: 'Right rotation', values: [30, 20, 10] },
  { label: 'Left-right', values: [30, 10, 20] }, { label: 'Right-left', values: [10, 30, 20] },
  { label: 'Delete: red sibling', values: [1, 2, 3, 4, 5, 6], delete: 1 },
  { label: 'Delete: black children', values: [5, 2, 1, 4, 3, 6], delete: 1 },
  { label: 'Delete: near red', values: [2, 1, 4, 3], delete: 1 },
  { label: 'Delete: far red', values: [2, 1, 3, 4], delete: 1 },
];
export const redBlackAdapter: AdvancedAdapter<RBNode> = {
  name: 'Red-Black Tree', binary: true, insert: insertRB, remove: deleteRB, search: searchRB, render: renderRB, validate: validateRB, examples: EXAMPLES_RB,
  stats: root => { let nodes = 0, red = 0, height = -1, bh = 1; const walk = (n: RBNode | null, d: number) => { if (!n) return; nodes++; if (n.color === 'RED') red++; height = Math.max(height, d); walk(n.left, d + 1); walk(n.right, d + 1); }; walk(root, 0); let n = root; while (n) { if (n.color === 'BLACK') bh++; n = n.left; } return [['Keys', nodes], ['Nodes', nodes], ['Height (edges)', height], ['Black height (incl. NIL)', bh], ['Red nodes', red], ['Black nodes', nodes - red]]; },
  code: { insert: ['insert(key)', 'find key by BST ordering', 'insert new red leaf', 'while parent red: inspect uncle', 'if uncle red: recolor; move upward', 'if inner child: rotate parent', 'recolor; rotate grandparent (mirrored)', 'make root black', 'finish; ignore duplicates'], delete: ['delete(key)', 'find node by BST ordering', 'if two children: use successor', 'transplant; remember removed color', 'while black deficit: inspect sibling', 'case 1: red sibling → recolor, rotate', 'case 2: black children → move deficit up', 'case 3: near red → rotate sibling', 'case 4: far red → recolor, rotate parent', 'blacken replacement; resolve deficit', 'finish'], search: ['search(key)', 'compare; follow left or right child', 'return found or black NIL'] },
};
