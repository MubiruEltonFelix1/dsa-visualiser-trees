// Binary Search Tree model — immutable operations return new roots.
import type { RNode } from "./traversal";

export interface TreeNode {
  id: number;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

let nextId = 1;
const make = (value: number): TreeNode => ({ id: nextId++, value, left: null, right: null });

export function contains(root: TreeNode | null, v: number): boolean {
  let n = root;
  while (n) {
    if (v === n.value) return true;
    n = v < n.value ? n.left : n.right;
  }
  return false;
}

export function insert(root: TreeNode | null, v: number): TreeNode {
  if (!root) return make(v);
  if (v < root.value) return { ...root, left: insert(root.left, v) };
  if (v > root.value) return { ...root, right: insert(root.right, v) };
  return root;
}

/** Handles leaf, one-child and two-children cases (inorder successor replacement). */
export function remove(root: TreeNode | null, v: number): TreeNode | null {
  if (!root) return null;
  if (v < root.value) return { ...root, left: remove(root.left, v) };
  if (v > root.value) return { ...root, right: remove(root.right, v) };
  if (!root.left) return root.right;
  if (!root.right) return root.left;
  let succ = root.right;
  while (succ.left) succ = succ.left;
  return { ...root, value: succ.value, id: succ.id, right: remove(root.right, succ.value) };
}

export function buildFrom(values: number[]): { root: TreeNode | null; duplicates: number[] } {
  let root: TreeNode | null = null;
  const duplicates: number[] = [];
  for (const v of values) {
    if (contains(root, v)) duplicates.push(v);
    else root = insert(root, v);
  }
  return { root, duplicates };
}

export function minMax(root: TreeNode | null): { min: number | null; max: number | null } {
  if (!root) return { min: null, max: null };
  let a = root, b = root;
  while (a.left) a = a.left;
  while (b.right) b = b.right;
  return { min: a.value, max: b.value };
}

/** Binary nodes keep both slots (null preserved) so left/right is unambiguous. */
export function bstToR(n: TreeNode | null): RNode | null {
  if (!n) return null;
  return { id: n.id, label: String(n.value), kids: [bstToR(n.left), bstToR(n.right)] };
}

export function parseValues(input: string): { values: number[]; error?: string } {
  const parts = input.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { values: [], error: "Enter at least one number." };
  const values: number[] = [];
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isFinite(n)) return { values: [], error: `"${p}" is not a valid number.` };
    values.push(n);
  }
  return { values };
}

export function randomValues(count: number, max = Math.max(99, count * 4)): number[] {
  const set = new Set<number>();
  while (set.size < count) set.add(1 + Math.floor(Math.random() * max));
  return [...set];
}

export const BST_PRESETS: { label: string; values: () => number[] }[] = [
  { label: "Small BST", values: () => [8, 4, 12, 2, 6] },
  { label: "Balanced-Looking BST", values: () => [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43, 56, 68, 81, 93] },
  { label: "Unbalanced BST", values: () => [10, 20, 30, 40, 50, 45, 60, 70] },
  { label: "Larger BST (40)", values: () => randomValues(40) },
];
