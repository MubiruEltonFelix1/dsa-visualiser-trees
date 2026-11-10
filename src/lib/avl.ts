// AVL algorithms on the immutable BST model. Every operation records a list of
// tree snapshots (frames) so the UI can step backward/forward through real history.
// Rotations keep node ids, so the canvas animates nodes moving to new positions.
import { contains, insert, remove, type TreeNode } from "./bst";

export type Role = "unbalanced" | "pivot" | "promoted" | "subtree" | "balanced" | "focus";
export type Case = "LL" | "RR" | "LR" | "RL";
export type Dir = "left" | "right";
export interface Frame { tree: TreeNode | null; title: string; note: string; roles: Record<number, Role> }
export interface RotationLog { frame: number; dir: Dir; pivot: number; promoted: number; label: string }
export type OpKind = "insert" | "delete" | "build" | "balance" | "rotate" | "load";
export interface Operation {
  label: string; kind: OpKind; frames: Frame[]; rotations: RotationLog[];
  /** Tree before any rotation (for before/after comparison); null when not comparable. */
  before: TreeNode | null; after: TreeNode | null; error?: string;
}

// ---------- Measurements (height in edges: leaf 0, empty -1) ----------
const hCache = new WeakMap<TreeNode, number>();
export function height(n: TreeNode | null): number {
  if (!n) return -1;
  let v = hCache.get(n);
  if (v === undefined) { v = 1 + Math.max(height(n.left), height(n.right)); hCache.set(n, v); }
  return v;
}
export const balanceFactor = (n: TreeNode) => height(n.left) - height(n.right);

export function find(root: TreeNode | null, v: number): TreeNode | null {
  let n = root;
  while (n && n.value !== v) n = v < n.value ? n.left : n.right;
  return n;
}
export function subtreeIds(n: TreeNode | null, out: number[] = []): number[] {
  if (n) { out.push(n.id); subtreeIds(n.left, out); subtreeIds(n.right, out); }
  return out;
}
export function inorder(n: TreeNode | null, out: number[] = []): number[] {
  if (n) { inorder(n.left, out); out.push(n.value); inorder(n.right, out); }
  return out;
}
export function isBST(root: TreeNode | null): boolean {
  const s = inorder(root);
  return s.every((v, i) => i === 0 || s[i - 1]! < v);
}
/** Checks EVERY node, not just the root. */
export function isAVL(n: TreeNode | null): boolean {
  return !n || (Math.abs(balanceFactor(n)) <= 1 && isAVL(n.left) && isAVL(n.right));
}
export interface NodeInfo { id: number; value: number; lh: number; rh: number; bf: number }
export function nodeInfo(root: TreeNode | null): NodeInfo[] {
  const out: NodeInfo[] = [];
  const rec = (n: TreeNode | null) => {
    if (!n) return;
    rec(n.left);
    out.push({ id: n.id, value: n.value, lh: height(n.left), rh: height(n.right), bf: balanceFactor(n) });
    rec(n.right);
  };
  rec(root);
  return out;
}
export const unbalancedNodes = (root: TreeNode | null) => nodeInfo(root).filter((i) => Math.abs(i.bf) > 1);

// ---------- Rotations (genuine structural transformations) ----------
export const rotateLeftNode = (n: TreeNode): TreeNode => { const r = n.right!; return { ...r, left: { ...n, right: r.left } }; };
export const rotateRightNode = (n: TreeNode): TreeNode => { const l = n.left!; return { ...l, right: { ...n, left: l.right } }; };

export function rotateAt(root: TreeNode | null, v: number, dir: Dir): { root: TreeNode | null; error?: string } {
  const target = find(root, v);
  if (!target) return { root, error: `${v} is not in the tree.` };
  if (dir === "left" && !target.right) return { root, error: `Cannot rotate left around ${v}: a left rotation promotes the right child, but ${v} has no right child.` };
  if (dir === "right" && !target.left) return { root, error: `Cannot rotate right around ${v}: a right rotation promotes the left child, but ${v} has no left child.` };
  const rec = (n: TreeNode): TreeNode => {
    if (n.value === v) return dir === "left" ? rotateLeftNode(n) : rotateRightNode(n);
    return v < n.value ? { ...n, left: rec(n.left!) } : { ...n, right: rec(n.right!) };
  };
  return { root: rec(root!) };
}

export function classify(n: TreeNode): Case | null {
  const b = balanceFactor(n);
  if (b > 1) return balanceFactor(n.left!) >= 0 ? "LL" : "LR";
  if (b < -1) return balanceFactor(n.right!) <= 0 ? "RR" : "RL";
  return null;
}

/** Deepest node with |BF| > 1; ties broken by smallest value (deterministic). */
export function deepestUnbalanced(root: TreeNode | null): TreeNode | null {
  let best: TreeNode | null = null, bestD = -1;
  const rec = (n: TreeNode | null, d: number) => {
    if (!n) return;
    rec(n.left, d + 1);
    if (Math.abs(balanceFactor(n)) > 1 && d > bestD) { best = n; bestD = d; }
    rec(n.right, d + 1);
  };
  rec(root, 0);
  return best;
}

export function describeRotation(n: TreeNode, dir: Dir) {
  const promoted = dir === "right" ? n.left! : n.right!;
  const moved = dir === "right" ? promoted.right : promoted.left;
  const side = dir === "right" ? "right" : "left", other = dir === "right" ? "left" : "right";
  const text = `${promoted.value} is promoted into ${n.value}'s position. ${n.value} becomes the ${side} child of ${promoted.value}. ` +
    (moved
      ? `${promoted.value}'s old ${side} subtree (rooted at ${moved.value}) is reattached as ${n.value}'s ${other} child — every value in it lies between ${promoted.value} and ${n.value}, so BST order is preserved.`
      : `${promoted.value} had no ${side} subtree, so ${n.value}'s ${other} side becomes empty.`);
  return { promoted, moved, text };
}

// ---------- Frame recording ----------
interface Ctx { frames: Frame[]; rotations: RotationLog[]; before: TreeNode | null }
const rolesFor = (ids: number[], role: Role, base: Record<number, Role> = {}) => { const r = { ...base }; ids.forEach((i) => (r[i] = role)); return r; };
const fmt = (b: number) => (b > 0 ? `+${b}` : `${b}`);

function applyRotation(ctx: Ctx, tree: TreeNode, v: number, dir: Dir, prefix: string, extra: Record<number, Role> = {}): TreeNode {
  const n = find(tree, v)!;
  const d = describeRotation(n, dir);
  const roles = rolesFor(subtreeIds(d.moved), "subtree", extra);
  roles[n.id] = "pivot"; roles[d.promoted.id] = "promoted";
  const name = `${dir === "left" ? "Left" : "Right"} rotation around ${v}`;
  ctx.frames.push({ tree, title: `${prefix}${name}`, note: `Pivot ${v} (dashed ring) will move down; ${d.promoted.value} (cyan) moves up. ${d.text}`, roles });
  const r = rotateAt(tree, v, dir).root!;
  ctx.rotations.push({ frame: ctx.frames.length, dir, pivot: v, promoted: d.promoted.value, label: `${prefix}${name} — promotes ${d.promoted.value}` });
  ctx.frames.push({ tree: r, title: `After ${dir} rotation`, note: `${d.promoted.value} now sits where ${v} was, with ${v} as its ${dir === "right" ? "right" : "left"} child.`, roles });
  return r;
}

const CASE_NOTE: Record<Case, (u: number, c: number, b: number) => string> = {
  LL: (u, c, b) => `Left-Left: the extra height is in the left subtree of ${u}'s left child ${c} (BF(${c}) = ${fmt(b)}). One right rotation around ${u} fixes it.`,
  RR: (u, c, b) => `Right-Right: the extra height is in the right subtree of ${u}'s right child ${c} (BF(${c}) = ${fmt(b)}). One left rotation around ${u} fixes it.`,
  LR: (u, c, b) => `Left-Right: the extra height is in the right subtree of ${u}'s left child ${c} (BF(${c}) = ${fmt(b)}). A single right rotation would just move the problem, so first rotate left around ${c} — that turns it into an LL case — then rotate right around ${u}.`,
  RL: (u, c, b) => `Right-Left: the extra height is in the left subtree of ${u}'s right child ${c} (BF(${c}) = ${fmt(b)}). First rotate right around ${c} — that turns it into an RR case — then rotate left around ${u}.`,
};

function rebalance(ctx: Ctx, tree: TreeNode | null, cap: number): TreeNode | null {
  let guard = 0;
  for (;;) {
    const u = deepestUnbalanced(tree);
    if (!u || !tree) return tree;
    if (++guard > cap) throw new Error("Balancing did not converge — the original tree was kept unchanged.");
    ctx.before ??= tree;
    const c = classify(u)!;
    const b = balanceFactor(u);
    const child = c[0] === "L" ? u.left! : u.right!;
    ctx.frames.push({
      tree, title: `Node ${u.value} is unbalanced`,
      note: `BF(${u.value}) = h(left) − h(right) = ${height(u.left)} − ${height(u.right)} = ${fmt(b)}. AVL requires −1 ≤ BF ≤ +1, so ${u.value} is ${b > 0 ? "left" : "right"}-heavy. It is the deepest unbalanced node, so it is fixed first.`,
      roles: { [u.id]: "unbalanced" },
    });
    ctx.frames.push({ tree, title: `${c} case detected`, note: CASE_NOTE[c](u.value, child.value, balanceFactor(child)), roles: { ...rolesFor(subtreeIds(child), "subtree"), [u.id]: "unbalanced", [child.id]: "focus" } });
    let t: TreeNode = tree;
    if (c === "LR" || c === "RL") {
      t = applyRotation(ctx, t, child.value, c === "LR" ? "left" : "right", "Step 1: ", { [u.id]: "unbalanced" });
      ctx.frames.push({
        tree: t, title: `Intermediate tree — now an ${c === "LR" ? "LL" : "RR"} case`,
        note: `After the first rotation the heavy path under ${u.value} runs ${c === "LR" ? "left-left" : "right-right"}, so a single ${c === "LR" ? "right" : "left"} rotation around ${u.value} finishes the job.`,
        roles: { [find(t, u.value)!.id]: "unbalanced" },
      });
    }
    const dir: Dir = c === "LL" || c === "LR" ? "right" : "left";
    const promotedVal = (dir === "right" ? find(t, u.value)!.left! : find(t, u.value)!.right!).value;
    t = applyRotation(ctx, t, u.value, dir, c.length && (c === "LR" || c === "RL") ? "Step 2: " : "");
    const top = find(t, promotedVal)!;
    ctx.frames.push({
      tree: t, title: "Heights and balance factors recalculated",
      note: `In the subtree now rooted at ${top.value}: ${nodeInfo(top).map((i) => `BF(${i.value}) = ${fmt(i.bf)}`).join(", ")}.`,
      roles: rolesFor(subtreeIds(top), "balanced"),
    });
    tree = t;
  }
}

function finish(ctx: Ctx, label: string, kind: OpKind, after: TreeNode | null, requireAVL: boolean): Operation {
  const ok = isAVL(after);
  if (requireAVL && !ok) throw new Error("Internal check failed: result is not AVL-balanced.");
  if (!isBST(after)) throw new Error("Internal check failed: BST ordering was broken.");
  const n = subtreeIds(after).length;
  const bad = unbalancedNodes(after);
  ctx.frames.push({
    tree: after, title: ok ? "Complete — AVL property verified" : "Complete — tree is NOT AVL-balanced",
    note: !after ? "The tree is empty." : ok
      ? `Checked all ${n} nodes: every balance factor is −1, 0 or +1. Height = ${height(after)}.`
      : `Nodes outside −1..+1: ${bad.map((b) => `${b.value} (${fmt(b.bf)})`).join(", ")}. Press "Balance tree" to fix them.`,
    roles: ok ? rolesFor(subtreeIds(after), "balanced") : rolesFor(bad.map((b) => b.id), "unbalanced"),
  });
  return { label, kind, frames: ctx.frames, rotations: ctx.rotations, before: ctx.before, after };
}

function run(label: string, kind: OpKind, root: TreeNode | null, body: (ctx: Ctx) => Operation): Operation {
  const ctx: Ctx = { frames: [], rotations: [], before: null };
  try { return body(ctx); } catch (e) {
    return { label, kind, frames: [{ tree: root, title: "Operation failed", note: (e as Error).message, roles: {} }], rotations: [], before: null, after: root, error: (e as Error).message };
  }
}

function insertSteps(ctx: Ctx, tree: TreeNode | null, v: number, prefix = ""): TreeNode | null {
  if (contains(tree, v)) {
    ctx.frames.push({ tree, title: `${prefix}${v} already exists`, note: `Duplicate values are ignored — a BST stores each value once.`, roles: { [find(tree, v)!.id]: "focus" } });
    return tree;
  }
  const path: string[] = [];
  for (let n = tree; n; n = v < n.value ? n.left : n.right) path.push(`${v} ${v < n.value ? "<" : ">"} ${n.value} → go ${v < n.value ? "left" : "right"}`);
  const t = insert(tree, v);
  ctx.frames.push({ tree: t, title: `${prefix}Inserted ${v}`, note: path.length ? `${path.join("; ")}; empty spot found.` : `${v} becomes the root.`, roles: { [find(t, v)!.id]: "focus" } });
  if (isAVL(t)) {
    ctx.frames.push({ tree: t, title: "Still balanced", note: "Walking back up to the root, every ancestor still has BF in −1..+1, so no rotation is needed.", roles: {} });
    return t;
  }
  return rebalance(ctx, t, 1000);
}

export function avlInsert(root: TreeNode | null, v: number): Operation {
  return run(`Insert ${v}`, "insert", root, (ctx) => finish(ctx, `Insert ${v}`, "insert", insertSteps(ctx, root, v), true));
}

export function avlBuild(values: number[], root: TreeNode | null, animate: boolean): Operation {
  const label = `Insert ${values.join(", ")}`;
  return run(label, "build", root, (ctx) => {
    let t = root;
    if (animate) values.forEach((v, i) => (t = insertSteps(ctx, t, v, `[${i + 1}/${values.length}] `)));
    else {
      const scratch: Ctx = { frames: [], rotations: [], before: null };
      for (const v of values) if (!contains(t, v)) t = rebalance(scratch, insert(t, v), 1000);
      ctx.rotations = []; // not animated
    }
    ctx.before = null;
    return finish(ctx, label, "build", t, true);
  });
}

export function avlDelete(root: TreeNode | null, v: number): Operation {
  return run(`Delete ${v}`, "delete", root, (ctx) => {
    const n = find(root, v);
    if (!n) throw new Error(`${v} is not in the tree.`);
    const kind = n.left && n.right ? "two children: it is replaced by its inorder successor (smallest value in its right subtree)"
      : n.left || n.right ? "one child: that child takes its place" : "no children: it is simply removed";
    ctx.frames.push({ tree: root, title: `Delete ${v}`, note: `${v} has ${kind}.`, roles: { [n.id]: "focus" } });
    const t = remove(root, v);
    ctx.frames.push({ tree: t, title: `Removed ${v}`, note: isAVL(t) ? "Every ancestor still has BF in −1..+1 — no rotation needed." : "Heights changed along the path to the root. Deletion can unbalance several ancestors, so each one is checked and fixed in turn.", roles: {} });
    return finish(ctx, `Delete ${v}`, "delete", rebalance(ctx, t, 1000), true);
  });
}

/** Balances any BST using only local rotations (deepest unbalanced node first). */
export function balanceBST(root: TreeNode | null): Operation {
  return run("Balance BST", "balance", root, (ctx) => {
    const bad = unbalancedNodes(root);
    ctx.before = root;
    ctx.frames.push({
      tree: root, title: "Original BST",
      note: bad.length ? `Unbalanced nodes: ${bad.map((b) => `${b.value} (BF ${fmt(b.bf)})`).join(", ")}. They will be fixed one rotation at a time, deepest first.` : "Every node already satisfies −1 ≤ BF ≤ +1 — no rotations needed.",
      roles: rolesFor(bad.map((b) => b.id), "unbalanced"),
    });
    const n = subtreeIds(root).length;
    const after = rebalance(ctx, root, 50 * n + 50);
    ctx.before = root;
    if (inorder(after).join() !== inorder(root).join()) throw new Error("Inorder sequence changed — original tree kept.");
    return finish(ctx, "Balance BST", "balance", after, true);
  });
}

export function manualRotate(root: TreeNode | null, v: number, dir: Dir): Operation {
  const label = `Manual ${dir} rotation around ${v}`;
  return run(label, "rotate", root, (ctx) => {
    const check = rotateAt(root, v, dir);
    if (check.error) throw new Error(check.error);
    ctx.before = root;
    const t = applyRotation(ctx, root!, v, dir, "Manual: ");
    ctx.frames.push({ tree: t, title: "Single structural rotation", note: "This is one manual rotation, not a full AVL rebalance. It keeps BST order but does not guarantee every node is balanced.", roles: {} });
    return finish(ctx, label, "rotate", t, false);
  });
}

export function loadRaw(values: number[], label: string): Operation {
  let t: TreeNode | null = null;
  for (const v of values) t = insert(t, v);
  const bad = unbalancedNodes(t);
  return {
    label, kind: "load", rotations: [], before: null, after: t,
    frames: [{
      tree: t, title: `${label} — loaded as an ordinary BST`,
      note: bad.length ? `Not balanced yet. Unbalanced nodes: ${bad.map((b) => `${b.value} (BF ${fmt(b.bf)})`).join(", ")}. Press "Balance tree" to watch the rotations.` : "Every node already satisfies −1 ≤ BF ≤ +1 — this is a valid AVL tree.",
      roles: rolesFor(bad.map((b) => b.id), "unbalanced"),
    }],
  };
}

export const AVL_EXAMPLES: { label: string; values: number[]; animateInsert: boolean }[] = [
  { label: "LL case", values: [30, 20, 10], animateInsert: true },
  { label: "RR case", values: [10, 20, 30], animateInsert: true },
  { label: "LR case", values: [30, 10, 20], animateInsert: true },
  { label: "RL case", values: [10, 30, 20], animateInsert: true },
  { label: "Right-skewed BST", values: [10, 20, 30, 40, 50, 60, 70, 80], animateInsert: false },
  { label: "Left-skewed BST", values: [80, 70, 60, 50, 40, 30, 20, 10], animateInsert: false },
  { label: "Mixed unbalanced BST", values: [50, 20, 80, 10, 30, 25, 27, 26, 90, 95, 99], animateInsert: false },
  { label: "Already balanced BST", values: [40, 20, 60, 10, 30, 50, 70], animateInsert: false },
];
