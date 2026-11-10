import type { RNode } from './traversal';
import type { AdvancedAdapter, TreeOperation, TreeExample } from './tree-operation';

export interface TwoThreeNode { id: number; keys: number[]; children: TwoThreeNode[] }
let nextId = 1;
const node = (keys: number[], children: TwoThreeNode[] = []): TwoThreeNode => ({ id: nextId++, keys, children });
export const clone23 = (n: TwoThreeNode | null): TwoThreeNode | null => n ? { id: n.id, keys: [...n.keys], children: n.children.map(c => clone23(c) as TwoThreeNode) } : null;
export function keys23(n: TwoThreeNode | null): number[] {
  if (!n) return [];
  const out: number[] = [];
  n.keys.forEach((k, i) => { out.push(...keys23(n.children[i] ?? null), k); });
  out.push(...keys23(n.children[n.keys.length] ?? null));
  return out;
}
export function validate23(root: TwoThreeNode | null): string[] {
  const errors: string[] = [], depths = new Set<number>();
  const walk = (n: TwoThreeNode, low: number, high: number, depth: number) => {
    if (n.keys.length !== 1 && n.keys.length !== 2) errors.push('Node must have one or two keys.');
    n.keys.forEach((k, i) => { if (!(k > low && k < high) || (i > 0 && k <= (n.keys[i - 1] ?? low))) errors.push('Keys violate strict search ordering.'); });
    if (!n.children.length) depths.add(depth);
    else {
      if (n.children.length !== n.keys.length + 1) errors.push('Child count must equal key count + 1.');
      n.children.forEach((c, i) => walk(c, n.keys[i - 1] ?? low, n.keys[i] ?? high, depth + 1));
    }
  };
  if (root) walk(root, -Infinity, Infinity, 0);
  if (depths.size > 1) errors.push('Leaf depths differ.');
  return errors;
}

function operation23(input: TwoThreeNode | null, values: number[], kind: TreeOperation<TwoThreeNode>['kind']): TreeOperation<TwoThreeNode> {
  let root = clone23(input);
  const op: TreeOperation<TwoThreeNode> = { label: `${kind === 'insert' ? 'Insert' : kind === 'delete' ? 'Delete' : 'Search'} ${values.join(', ')}`, kind, after: null, frames: [], rotations: 0, recolors: 0 };
  let path: number[] = [];
  const record = (title: string, note: string, line: number, focus: number | null = null, property = 'Sorted keys partition child ranges; all leaves have equal depth.') => {
    op.frames.push({ tree: clone23(root), title, note, line, focus, property, path: [...path] });
  };
  record('Before operation', 'Start with the current 2–3 tree.', 0);
  const locate = (v: number) => {
    let n = root; path = [];
    while (n) {
      path.push(n.id); record('Compare keys', `Compare ${v} with [${n.keys.join(', ')}]; follow its ordered child interval.`, 1, n.id);
      if (n.keys.includes(v)) return n;
      let i = 0; while (i < n.keys.length && v > (n.keys[i] ?? Infinity)) i++;
      n = n.children[i] ?? null;
    }
    return null;
  };
  const split = (n: TwoThreeNode): { key: number; left: TwoThreeNode; right: TwoThreeNode } | null => {
    if (n.keys.length < 3) return null;
    const [a, b, c] = n.keys;
    if (a === undefined || b === undefined || c === undefined) return null;
    record('Overflow: split node', `Three keys [${n.keys.join(', ')}] exceed capacity. Promote the middle key ${b}.`, 3, n.id, 'An overflow is temporary: split into two one-key nodes at the same depth.');
    return { key: b, left: { id: n.id, keys: [a], children: n.children.slice(0, 2) }, right: node([c], n.children.slice(2)) };
  };
  const insert = (n: TwoThreeNode, v: number): ReturnType<typeof split> => {
    let i = 0; while (i < n.keys.length && v > (n.keys[i] ?? Infinity)) i++;
    if (!n.children.length) {
      n.keys.splice(i, 0, v); record('Insert in leaf', `Place ${v} in sorted order inside the leaf.`, 2, n.id);
    } else {
      const child = n.children[i];
      if (child) {
        const s = insert(child, v);
        if (s) {
          n.keys.splice(i, 0, s.key); n.children.splice(i, 1, s.left, s.right);
          record('Promote middle key', `Move ${s.key} into the parent and attach the two split children.`, 4, n.id);
        }
      }
    }
    return split(n);
  };
  const repair = (parent: TwoThreeNode, i: number) => {
    const n = parent.children[i]; if (!n || n.keys.length) return;
    const left = parent.children[i - 1], right = parent.children[i + 1];
    record('Underflow', 'A child has no keys; restore the minimum one-key capacity.', 4, n.id, 'Repair underflow without changing the common leaf depth.');
    if (left && left.keys.length === 2) {
      const sep = parent.keys[i - 1], borrowed = left.keys.pop();
      if (sep === undefined || borrowed === undefined) return;
      n.keys.push(sep); parent.keys[i - 1] = borrowed;
      const c = left.children.pop(); if (c) n.children.unshift(c);
      record('Borrow from left sibling', `${sep} moves down; ${borrowed} moves up from the left sibling.`, 5, n.id);
    } else if (right && right.keys.length === 2) {
      const sep = parent.keys[i], borrowed = right.keys.shift();
      if (sep === undefined || borrowed === undefined) return;
      n.keys.push(sep); parent.keys[i] = borrowed;
      const c = right.children.shift(); if (c) n.children.push(c);
      record('Borrow from right sibling', `${sep} moves down; ${borrowed} moves up from the right sibling.`, 5, n.id);
    } else if (left) {
      const sep = parent.keys.splice(i - 1, 1)[0]; if (sep === undefined) return;
      left.keys.push(sep, ...n.keys); left.children.push(...n.children); parent.children.splice(i, 1);
      record('Merge with left sibling', `Combine the empty node, separator ${sep}, and left sibling. The parent may now underflow.`, 6, left.id);
    } else if (right) {
      const sep = parent.keys.splice(i, 1)[0]; if (sep === undefined) return;
      n.keys.push(sep, ...right.keys); n.children.push(...right.children); parent.children.splice(i + 1, 1);
      record('Merge with right sibling', `Combine the empty node, separator ${sep}, and right sibling. The parent may now underflow.`, 6, n.id);
    }
  };
  const remove = (n: TwoThreeNode, v: number) => {
    let i = 0; while (i < n.keys.length && v > (n.keys[i] ?? Infinity)) i++;
    if (n.keys[i] === v) {
      if (!n.children.length) { n.keys.splice(i, 1); record('Remove leaf key', `Remove ${v} from its leaf.`, 3, n.id); }
      else {
        const successorChild = n.children[i + 1];
        if (!successorChild) return;
        let successor: TwoThreeNode = successorChild;
        while (successor.children.length) { const c: TwoThreeNode | undefined = successor.children[0]; if (!c) break; successor = c; }
        const key = successor.keys[0]; if (key === undefined) return;
        n.keys[i] = key; record('Successor replacement', `Replace internal key ${v} with successor ${key}, then remove the successor from its leaf.`, 2, n.id);
        const c = n.children[i + 1]; if (c) { remove(c, key); repair(n, i + 1); }
      }
    } else { const c = n.children[i]; if (c) { remove(c, v); repair(n, i); } }
  };
  for (const v of values) {
    const found = locate(v);
    if (kind === 'search') { record(found ? 'Key found' : 'Key not found', found ? `${v} is present in this node.` : `${v} is absent; its search interval reached an empty child.`, 2, found?.id ?? null); continue; }
    if (kind === 'insert') {
      if (found) { record('Duplicate ignored', `${v} already exists; keys remain unique.`, 6, found.id); continue; }
      if (!root) { root = node([v]); record('Create root', `${v} becomes a one-key root.`, 2, root.id); }
      else { const s = insert(root, v); if (s) { root = node([s.key], [s.left, s.right]); record('Root split', `Create a new root with promoted key ${s.key}; every leaf depth increases by one.`, 5, root.id); } }
    } else if (found && root) {
      remove(root, v);
      if (!root.keys.length) { root = root.children[0] ?? null; record('Root contraction', 'Discard the empty root; its only child becomes root, or the tree becomes empty.', 7, root?.id ?? null); }
    } else record('Key not found', `${v} is absent; no deletion is performed.`, 8);
    path = []; record('Operation complete', 'Every node has one or two keys; all leaves remain at equal depth.', kind === 'insert' ? 6 : 8, null);
  }
  op.after = clone23(root); return op;
}
export const insert23 = (root: TwoThreeNode | null, values: number[]) => operation23(root, values, 'insert');
export const delete23 = (root: TwoThreeNode | null, value: number) => operation23(root, [value], 'delete');
export const search23 = (root: TwoThreeNode | null, value: number) => operation23(root, [value], 'search');
export const render23 = (n: TwoThreeNode | null): RNode | null => n ? { id: n.id, label: n.keys.join(' | ') || '∅', keys: [...n.keys], kids: n.children.map(render23) } : null;
export const EXAMPLES23: TreeExample[] = [
  { label: 'Simple insertion', values: [10, 20] }, { label: 'Leaf split', values: [20, 10, 30, 5, 15] },
  { label: 'Cascading split', values: [10, 20, 30, 40, 50, 60, 70] }, { label: 'Root split', values: [10, 20, 30] },
  { label: 'Deletion: borrow', values: [10, 20, 30, 40], delete: 10 }, { label: 'Deletion: merge', values: [10, 20, 30], delete: 10 },
];
export const twoThreeAdapter: AdvancedAdapter<TwoThreeNode> = {
  name: '2–3 Tree', binary: false, insert: insert23, remove: delete23, search: search23, render: render23, validate: validate23, examples: EXAMPLES23,
  stats: root => { let nodes = 0, twos = 0, threes = 0, height = -1; const walk = (n: TwoThreeNode, d: number) => { nodes++; if (n.keys.length === 1) twos++; if (n.keys.length === 2) threes++; height = Math.max(height, d); n.children.forEach(c => walk(c, d + 1)); }; if (root) walk(root, 0); return [['Keys', keys23(root).length], ['Nodes', nodes], ['Height (edges)', height], ['2-nodes', twos], ['3-nodes', threes], ['Equal leaf depths', validate23(root).some(e => e.includes('depth')) ? 'No' : 'Yes']]; },
  code: { insert: ['insert(key)', 'find ordered leaf interval', 'insert key in sorted leaf', 'if overflow: split around middle', 'promote middle into parent; repeat', 'if root split: create new root', 'finish; ignore duplicate keys'], delete: ['delete(key)', 'find key by ordered intervals', 'if internal: replace with successor', 'remove key from leaf', 'if underflow: inspect siblings', 'if sibling has two keys: borrow', 'else: merge with parent separator; repeat', 'if root empty: contract root', 'finish'], search: ['search(key)', 'compare keys; follow ordered interval', 'return found or absent'] },
};
