import type { RNode } from "./traversal";

export interface Positioned { id: number; label: string; x: number; y: number; keys?: number[]; color?: 'RED' | 'BLACK'; nodeWidth: number }
export interface Edge { from: number; to: number; x1: number; y1: number; x2: number; y2: number }

/**
 * binary: x = inorder index (keeps left/right sides exact, never overlaps).
 * general: leaves take consecutive slots; parents centred over their children.
 */
export function layout(root: RNode | null, binary: boolean, gapX = 60, gapY = 84) {
  const cellWidth = (n: RNode) => n.keys ? Math.max(44, ...n.keys.map(k => String(k).length * 8 + 16)) : 44;
  const nodeWidth = (n: RNode) => n.keys ? Math.max(1, n.keys.length) * cellWidth(n) : 44;
  let maxNodeWidth = 44;
  const measure = (n: RNode) => { maxNodeWidth = Math.max(maxNodeWidth, nodeWidth(n)); n.kids.forEach(c => { if (c) measure(c); }); };
  if (root) measure(root);
  gapX = Math.max(gapX, maxNodeWidth + 24);
  const nodes: Positioned[] = [];
  const edges: Edge[] = [];
  let slot = 0;
  const place = (n: RNode, d: number): Positioned => {
    const me: Positioned = { id: n.id, label: n.label, x: 0, y: d * gapY, nodeWidth: nodeWidth(n), ...(n.keys ? { keys: n.keys } : {}), ...(n.color ? { color: n.color } : {}) };
    nodes.push(me);
    const placed: Positioned[] = [];
    if (binary) {
      const [l, r] = [n.kids[0] ?? null, n.kids[1] ?? null];
      if (l) placed.push(place(l, d + 1));
      me.x = slot++ * gapX;
      if (r) placed.push(place(r, d + 1));
    } else {
      for (const k of n.kids) if (k) placed.push(place(k, d + 1));
      const first = placed[0], last = placed.at(-1);
      me.x = first && last ? (first.x + last.x) / 2 : slot++ * gapX;
    }
    for (const c of placed) edges.push({ from: n.id, to: c.id, x1: 0, y1: me.y, x2: c.x, y2: c.y });
    return me;
  };
  if (root) place(root, 0);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) e.x1 = byId.get(e.from)?.x ?? 0;
  const xs = nodes.map((n) => n.x);
  const minX = nodes.length ? Math.min(...nodes.map(n => n.x - n.nodeWidth / 2 + 22)) : 0;
  const width = xs.length ? Math.max(...nodes.map(n => n.x + n.nodeWidth / 2 - 22)) - minX : 0;
  const height = nodes.length ? Math.max(...nodes.map((n) => n.y)) : 0;
  return { nodes, edges, width, height, minX };
}
