// General (n-ary) rooted tree model. IDs are unique and independent of labels.
import type { RNode } from "./traversal";

export interface GNode { id: number; label: string; children: GNode[] }
export interface GJson { label: string | number; children?: GJson[] }

let nextId = 1_000_000;
export const makeG = (label: string, children: GNode[] = []): GNode => ({ id: nextId++, label, children });

export function validateLabel(raw: string): { label?: string; error?: string } {
  const label = raw.trim();
  if (!label) return { error: "Enter a node label." };
  if (label.length > 24) return { error: "Labels can be at most 24 characters." };
  return { label };
}

export function findNode(root: GNode | null, id: number): GNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  for (const c of root.children) { const f = findNode(c, id); if (f) return f; }
  return null;
}

export function addChild(root: GNode, parentId: number, label: string): { root: GNode; child: GNode } {
  const child = makeG(label);
  const rec = (n: GNode): GNode => n.id === parentId ? { ...n, children: [...n.children, child] } : { ...n, children: n.children.map(rec) };
  return { root: rec(root), child };
}

export function rename(root: GNode, id: number, label: string): GNode {
  const rec = (n: GNode): GNode => n.id === id ? { ...n, label } : { ...n, children: n.children.map(rec) };
  return rec(root);
}

/** Removes the node and its whole subtree; removing the root empties the tree. */
export function removeSubtree(root: GNode | null, id: number): GNode | null {
  if (!root || root.id === id) return null;
  const rec = (n: GNode): GNode => ({ ...n, children: n.children.filter((c) => c.id !== id).map(rec) });
  return rec(root);
}

export function listNodes(root: GNode | null): { id: number; label: string; depth: number }[] {
  const out: { id: number; label: string; depth: number }[] = [];
  const rec = (n: GNode, d: number) => { out.push({ id: n.id, label: n.label, depth: d }); n.children.forEach((c) => rec(c, d + 1)); };
  if (root) rec(root, 0);
  return out;
}

/** Every node reachable exactly once ⇒ single parent per node and no cycles. */
export function validateStructure(root: GNode | null): { ok: boolean; error?: string } {
  const seenIds = new Set<number>();
  const seenObjs = new Set<GNode>();
  const stack = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop()!;
    if (seenObjs.has(n) || seenIds.has(n.id)) return { ok: false, error: `Node "${n.label}" has more than one parent or forms a cycle.` };
    seenObjs.add(n); seenIds.add(n.id);
    stack.push(...n.children);
  }
  return { ok: true };
}

export function fromJson(text: string): { root?: GNode; error?: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { error: "Invalid JSON — check commas, quotes and brackets." }; }
  if (Array.isArray(data)) return { error: "A tree must have exactly one root object, not an array." };
  let count = 0;
  const conv = (d: unknown, path: string): GNode => {
    if (++count > 5000) throw new Error("Trees from JSON are limited to 5000 nodes.");
    if (typeof d !== "object" || d === null) throw new Error(`${path}: each node must be an object like {"label": "A"}.`);
    const o = d as { label?: unknown; children?: unknown };
    if (typeof o.label !== "string" && typeof o.label !== "number") throw new Error(`${path}: missing "label" (string or number).`);
    const v = validateLabel(String(o.label));
    if (v.error) throw new Error(`${path}: ${v.error}`);
    if (o.children !== undefined && !Array.isArray(o.children)) throw new Error(`${path}: "children" must be an array.`);
    return makeG(v.label!, ((o.children as unknown[]) ?? []).map((c, i) => conv(c, `${path}.children[${i}]`)));
  };
  try { return { root: conv(data, "root") }; } catch (e) { return { error: (e as Error).message }; }
}

export function toJson(root: GNode | null): string {
  const rec = (n: GNode): GJson => n.children.length ? { label: n.label, children: n.children.map(rec) } : { label: n.label };
  return root ? JSON.stringify(rec(root), null, 2) : "";
}

export function generalToR(n: GNode | null): RNode | null {
  if (!n) return null;
  return { id: n.id, label: n.label, kids: n.children.map((c) => generalToR(c)) };
}

const g = (label: string, ...children: GNode[]) => makeG(label, children);

export const GENERAL_PRESETS: { label: string; build: () => GNode }[] = [
  { label: "Simple Tree", build: () => g("A", g("B", g("E"), g("F", g("H"), g("I"))), g("C"), g("D", g("G"))) },
  { label: "Wide Tree", build: () => g("Root", g("1"), g("2", g("2a"), g("2b"), g("2c")), g("3"), g("4"), g("5", g("5a")), g("6"), g("7")) },
  { label: "Deep Tree", build: () => g("L0", g("L1", g("L2", g("L3", g("L4", g("L5", g("L6"))), g("x")), g("y")), g("z"))) },
  {
    label: "Larger Tree (50)",
    build: () => {
      let root = makeG("N1");
      const ids = [root.id];
      for (let i = 2; i <= 50; i++) {
        const parent = ids[Math.floor(Math.random() * ids.length)]!;
        const r = addChild(root, parent, `N${i}`);
        root = r.root; ids.push(r.child.id);
      }
      return root;
    },
  },
];
