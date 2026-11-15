import type { GNode } from "./general";
import { validateStructure } from "./general";
import type { TreeNode } from "./bst";
import { height, isBST } from "./avl";
import { validate23, type TwoThreeNode } from "./two-three";
import { validateRB, type RBNode } from "./red-black";
import { heapToR, type HeapKind } from "./heap";
import type { RNode } from "./traversal";

export interface Invariant {
  name: string;
  explanation: string;
  scope: "Shared structure" | "Tree-specific";
  status: "Satisfied" | "Violated" | "Not Checked";
  violation?: string;
  nodeIds: number[];
}
interface Identified {
  id: number;
}
function inspect<T extends Identified>(root: T | null, children: (n: T) => T[]) {
  const nodes: T[] = [],
    seen = new Set<T>(),
    active = new Set<T>(),
    ids = new Set<number>();
  const parents = new Map<T, number>();
  const cyclic: number[] = [],
    repeated: number[] = [];
  const walk = (n: T) => {
    if (active.has(n)) {
      cyclic.push(n.id);
      return;
    }
    if (seen.has(n)) {
      repeated.push(n.id);
      return;
    }
    if (ids.has(n.id)) repeated.push(n.id);
    seen.add(n);
    ids.add(n.id);
    active.add(n);
    nodes.push(n);
    for (const c of children(n)) {
      parents.set(c, (parents.get(c) ?? 0) + 1);
      walk(c);
    }
    active.delete(n);
  };
  if (root) walk(root);
  return { nodes, parents, cyclic, repeated, safe: !cyclic.length && !repeated.length };
}
function rule(
  name: string,
  explanation: string,
  root: unknown,
  failed: number[],
  violation: string,
  scope: Invariant["scope"] = "Tree-specific",
  checked = true,
): Invariant {
  return {
    name,
    explanation,
    scope,
    status: !root || !checked ? "Not Checked" : failed.length ? "Violated" : "Satisfied",
    nodeIds: [...new Set(failed)],
    ...(!root || !checked || !failed.length ? {} : { violation }),
  };
}
function structure<T extends Identified>(
  root: T | null,
  info: ReturnType<typeof inspect<T>>,
): Invariant {
  return rule(
    "Valid tree structure",
    "One root, unique node IDs, one parent per child, and no cycles.",
    root,
    [...info.cyclic, ...info.repeated],
    "A node is repeated or lies on a cycle.",
    "Shared structure",
  );
}
export function generalInvariants(root: GNode | null): Invariant[] {
  const info = inspect(root, (n) => n.children);
  const rootParents = root && info.parents.has(root) ? [root.id] : [];
  const parentErrors = info.nodes
    .filter((n) => n !== root && info.parents.get(n) !== 1)
    .map((n) => n.id);
  // Reuse the existing structural validator after the cycle-safe inspection.
  const valid = info.safe && validateStructure(root).ok;
  return [
    rule(
      "Exactly one root",
      "A non-empty tree has one starting node.",
      root,
      rootParents,
      "The root is also reachable as a child.",
      "Shared structure",
    ),
    rule(
      "Root has no parent",
      "No child link points back to the root.",
      root,
      rootParents,
      "A child link points to the root.",
      "Shared structure",
    ),
    rule(
      "One parent per node",
      "Every node except the root has exactly one parent and a unique ID.",
      root,
      [...parentErrors, ...info.repeated],
      "A node has multiple parents or a duplicated ID.",
      "Shared structure",
    ),
    rule(
      "No cycles",
      "Following child links never returns to an ancestor.",
      root,
      info.cyclic,
      "A child link returns to an ancestor.",
      "Shared structure",
    ),
    rule(
      "Connected tree",
      "All nodes in this root-owned model are reachable from the root.",
      root,
      [],
      "",
      "Shared structure",
      valid,
    ),
  ];
}
export function binaryInvariants(root: TreeNode | null, avl = false): Invariant[] {
  const info = inspect(root, (n) => [n.left, n.right].filter((c): c is TreeNode => c !== null));
  const left: number[] = [],
    right: number[] = [],
    ordering: number[] = [],
    balance: number[] = [],
    heights: number[] = [];
  const walk = (n: TreeNode | null, low: number, high: number): number => {
    if (!n) return -1;
    if (!(n.value > low)) left.push(n.id);
    if (!(n.value < high)) right.push(n.id);
    if (!Number.isFinite(n.value) || !(n.value > low && n.value < high)) ordering.push(n.id);
    const lh = walk(n.left, low, n.value),
      rh = walk(n.right, n.value, high);
    if (Math.abs(lh - rh) > 1) balance.push(n.id);
    const actual = 1 + Math.max(lh, rh);
    if (avl && height(n) !== actual) heights.push(n.id);
    return actual;
  };
  if (info.safe) walk(root, -Infinity, Infinity);
  const common = structure(root, info);
  const ordered = rule(
    "BST ordering",
    "Every key stays strictly within all ancestor key bounds.",
    root,
    ordering,
    "A key violates its allowed ancestor range.",
    "Tree-specific",
    info.safe,
  );
  if (info.safe && root && !isBST(root) && !ordering.length) {
    ordered.status = "Violated";
    ordered.violation = "The inorder sequence is not strictly increasing.";
  }
  if (avl)
    return [
      common,
      ordered,
      rule(
        "Balance factors −1, 0, +1",
        "Left and right subtree heights differ by at most one at each node.",
        root,
        balance,
        "The subtree heights differ by more than one.",
        "Tree-specific",
        info.safe,
      ),
      rule(
        "Correct node heights",
        "Displayed heights match a fresh count of edges; a leaf has height zero.",
        root,
        heights,
        "The calculated height differs from the actual subtree height.",
        "Tree-specific",
        info.safe,
      ),
      rule(
        "Every subtree balanced",
        "The AVL requirement holds throughout the tree, not only at the root.",
        root,
        balance,
        "At least one subtree needs balancing.",
        "Tree-specific",
        info.safe,
      ),
    ];
  return [
    rule(
      "Left-subtree keys smaller",
      "Every key on the left is smaller than its ancestor key.",
      root,
      right,
      "A key in a left subtree is not smaller than its ancestor.",
      "Tree-specific",
      info.safe,
    ),
    rule(
      "Right-subtree keys greater",
      "Every key on the right is greater than its ancestor key.",
      root,
      left,
      "A key in a right subtree is not greater than its ancestor.",
      "Tree-specific",
      info.safe,
    ),
    ordered,
    common,
  ];
}
export function twoThreeInvariants(root: TwoThreeNode | null): Invariant[] {
  const info = inspect(root, (n) => n.children);
  const errors = info.safe ? validate23(root) : [];
  const badKeys = info.nodes
    .filter(
      (n) =>
        ![1, 2].includes(n.keys.length) ||
        n.keys.some((k, i) => !Number.isFinite(k) || (i > 0 && k <= (n.keys[i - 1] ?? k))),
    )
    .map((n) => n.id);
  const twos = info.nodes
    .filter((n) => n.keys.length === 1 && n.children.length > 0 && n.children.length !== 2)
    .map((n) => n.id);
  const threes = info.nodes
    .filter((n) => n.keys.length === 2 && n.children.length > 0 && n.children.length !== 3)
    .map((n) => n.id);
  const leaves = new Map<number, number>();
  const ranges: number[] = [];
  const walk = (n: TwoThreeNode, low: number, high: number, depth: number) => {
    if (n.keys.some((k) => !(k > low && k < high))) ranges.push(n.id);
    if (!n.children.length) leaves.set(n.id, depth);
    n.children.forEach((c, i) => walk(c, n.keys[i - 1] ?? low, n.keys[i] ?? high, depth + 1));
  };
  if (root && info.safe) walk(root, -Infinity, Infinity, 0);
  const differentDepths = errors.includes("Leaf depths differ.") ? [...leaves.keys()] : [];
  return [
    structure(root, info),
    rule(
      "One or two sorted keys",
      "Each node holds one or two finite keys in increasing order.",
      root,
      badKeys,
      "A node has an invalid key count or unsorted keys.",
    ),
    rule(
      "2-node: two children",
      "An internal node with one key has exactly two children.",
      root,
      twos,
      "A one-key internal node does not have two children.",
    ),
    rule(
      "3-node: three children",
      "An internal node with two keys has exactly three children.",
      root,
      threes,
      "A two-key internal node does not have three children.",
    ),
    rule(
      "Equal leaf depth",
      "All leaves are the same number of edges from the root.",
      root,
      differentDepths,
      "Leaves occur at different depths.",
      "Tree-specific",
      info.safe,
    ),
    rule(
      "Ordered child ranges",
      "Child keys lie in the intervals separated by the parent keys.",
      root,
      [...ranges, ...(errors.includes("Keys violate strict search ordering.") ? badKeys : [])],
      "A child key is outside its allowed interval.",
      "Tree-specific",
      info.safe,
    ),
  ];
}
export function redBlackInvariants(root: RBNode | null): Invariant[] {
  const info = inspect(root, (n) => [n.left, n.right].filter((c): c is RBNode => c !== null));
  const errors = info.safe ? validateRB(root) : [];
  const ids = (predicate: (n: RBNode) => boolean) => info.nodes.filter(predicate).map((n) => n.id);
  const ranges: number[] = [],
    blackHeights: number[] = [];
  const walk = (n: RBNode | null, low: number, high: number): number => {
    if (!n) return 1; // Exported null leaves represent black NIL leaves.
    if (!(n.key > low && n.key < high) || !Number.isFinite(n.key)) ranges.push(n.id);
    const l = walk(n.left, low, n.key),
      r = walk(n.right, n.key, high);
    if (l !== r) blackHeights.push(n.id);
    return l + (n.color === "BLACK" ? 1 : 0);
  };
  if (info.safe) walk(root, -Infinity, Infinity);
  const parentIds = ids((n) =>
    n === root ? n.parent !== null : !n.parent || (n.parent.left !== n && n.parent.right !== n),
  );
  const common = structure(root, info);
  if (root && parentIds.length) {
    common.status = "Violated";
    common.nodeIds.push(...parentIds);
    common.violation = "A stored parent pointer disagrees with its child link.";
  }
  return [
    common,
    rule(
      "Red or black nodes",
      "Every stored node has one of the two allowed colors.",
      root,
      ids((n) => n.color !== "RED" && n.color !== "BLACK"),
      "A node has an invalid color.",
    ),
    rule(
      "Black root",
      "The root is black, including after a repair completes.",
      root,
      root && root.color !== "BLACK" ? [root.id] : [],
      "The root is not black.",
    ),
    rule(
      "Black NIL leaves",
      "Each missing child is a black NIL leaf, represented by null in this snapshot.",
      root,
      ids((n) => n.id === 0 && n.color !== "BLACK"),
      "An explicit NIL node is not black.",
      "Tree-specific",
      info.safe,
    ),
    rule(
      "No red-red edge",
      "A red node can only have black nodes or NIL leaves as children.",
      root,
      ids((n) => n.color === "RED" && (n.left?.color === "RED" || n.right?.color === "RED")),
      "A red node has a red child.",
    ),
    rule(
      "Equal black height",
      "Every path to a descendant NIL leaf contains the same number of black nodes.",
      root,
      errors.includes("Black heights differ.") ? blackHeights : [],
      "Left and right paths have different black heights.",
      "Tree-specific",
      info.safe,
    ),
    rule(
      "BST ordering",
      "Left keys are smaller and right keys are greater across all ancestor bounds.",
      root,
      ranges,
      "A key violates its allowed ancestor range.",
      "Tree-specific",
      info.safe,
    ),
  ];
}

export function heapInvariants(heap: number[] | null, kind: HeapKind): Invariant[] {
  const empty = !heap || heap.length === 0;
  const violations: number[] = [];
  if (!empty) {
    for (let i = 0; i < heap.length; i++) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      const ok = (c: number) => (kind === "min" ? heap[i]! <= c : heap[i]! >= c);
      if (l < heap.length && !ok(heap[l]!)) violations.push(i);
      if (r < heap.length && !ok(heap[r]!)) violations.push(i);
    }
  }
  const root = heapToR(heap ?? []);
  const bfs: number[] = [];
  if (root) {
    const queue: RNode[] = [root];
    while (queue.length) {
      const n = queue.shift()!;
      bfs.push(Number(n.label));
      n.kids.forEach((c) => c && queue.push(c));
    }
  }
  const complete = !empty && bfs.length === heap!.length;
  const correspond = !empty && bfs.join(",") === heap!.join(",");
  const check = (
    name: string,
    explanation: string,
    failed: number[],
    violation: string,
  ): Invariant => ({
    name,
    explanation,
    scope: "Shared structure",
    status: empty ? "Not Checked" : failed.length ? "Violated" : "Satisfied",
    nodeIds: [...new Set(failed)],
    ...(failed.length ? { violation } : {}),
  });
  return [
    check(
      `${kind === "min" ? "Min" : "Max"}-heap property`,
      `Every parent ${kind === "min" ? "is less than or equal to" : "is greater than or equal to"} its children — the root holds the ${kind === "min" ? "minimum" : "maximum"}.`,
      violations,
      `A parent violates the ${kind === "min" ? "minimum" : "maximum"} property against a child.`,
    ),
    check(
      "Complete binary tree",
      "The array has no gaps: every level is full except possibly the last, filled left to right.",
      complete ? [] : [0],
      "The array representation is not a complete binary tree.",
    ),
    check(
      "Array and tree correspond",
      "The rendered tree's level-order sequence equals the array contents.",
      correspond ? [] : [0],
      "The tree rendering and the array disagree.",
    ),
  ];
}
