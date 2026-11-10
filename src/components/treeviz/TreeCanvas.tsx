import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { layout } from "@/lib/layout";
import type { RNode } from "@/lib/traversal";
import type { Role } from "@/lib/avl";

export interface Badge { text: string; tone: "even" | "left" | "right" | "bad"; title?: string }
const ROLE_CLASS: Record<Role, string> = {
  unbalanced: "fill-destructive/25 stroke-destructive",
  pivot: "fill-selected/20 stroke-selected",
  promoted: "fill-primary/30 stroke-primary",
  subtree: "fill-subtree/20 stroke-subtree",
  focus: "fill-node stroke-primary",
  balanced: "fill-success/15 stroke-success",
};
const BADGE_CLASS = { even: "fill-success", left: "fill-heavy-left", right: "fill-heavy-right", bad: "fill-destructive" };
import { Button } from "@/components/ui/button";

const R = 22;

interface Props {
  root: RNode | null;
  binary: boolean;
  currentId: number | null;
  visited: Set<number>;
  selectedId?: number | null | undefined;
  onSelect?: ((id: number | null) => void) | undefined;
  empty: ReactNode;
  roles?: Record<number, Role> | undefined;
  badges?: Map<number, Badge> | undefined;
  violationIds?: Set<number>;
}

export function TreeCanvas({ root, binary, currentId, visited, selectedId, onSelect, empty, roles, badges, violationIds }: Props) {
  const { nodes, edges, width, height, minX } = useMemo(() => layout(root, binary), [root, binary]);
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; moved: number } | null>(null);
  const lastMoved = useRef(0);

  const fit = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight, pad = 50;
    const k = Math.max(0.1, Math.min(1.6, (W - pad * 2) / (width + 2 * R || 1), (H - pad * 2) / (height + 2 * R || 1)));
    setView({ k, x: W / 2 - (minX + width / 2) * k, y: H / 2 - (height / 2) * k });
  }, [width, height, minX]);

  useLayoutEffect(() => { fit(); }, [fit, root]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { ro.disconnect(); el.removeEventListener("wheel", wheel); };
  }, [fit]);

  const zoomAt = (mx: number, my: number, f: number) =>
    setView((v) => {
      const k = Math.min(4, Math.max(0.1, v.k * f));
      return { k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k };
    });
  const zoom = (f: number) => { const el = box.current; if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, f); };

  return (
    <div
      ref={box}
      className="canvas-grid relative h-full min-h-[360px] w-full cursor-grab touch-none overflow-hidden rounded-lg border active:cursor-grabbing"
      onPointerDown={(e) => { drag.current = { px: e.clientX, py: e.clientY, moved: 0 }; }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.px, dy = e.clientY - d.py;
        drag.current = { px: e.clientX, py: e.clientY, moved: d.moved + Math.abs(dx) + Math.abs(dy) };
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }}
      onPointerUp={() => { lastMoved.current = drag.current?.moved ?? 0; drag.current = null; }}
      onPointerLeave={() => (drag.current = null)}
      onClick={() => { if (lastMoved.current < 5) onSelect?.(null); }}
    >
      {!root ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center" onPointerDown={(e) => e.stopPropagation()}>
          {empty}
        </div>
      ) : (
        <svg className="absolute inset-0 h-full w-full select-none">
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {edges.map((e) => (
              <line key={`e${e.from}-${e.to}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                className={`transition-all duration-300 ${visited.has(e.to) || currentId === e.to ? "stroke-success/60" : "stroke-edge"}`} strokeWidth={2} />
            ))}
            {nodes.map((n) => {
              const cur = n.id === currentId, vis = visited.has(n.id), sel = n.id === selectedId;
              const role = roles?.[n.id];
              const badge = badges?.get(n.id);
              const fs = n.label.length > 5 ? 9 : n.label.length > 3 ? 11 : 14;
              return (
                <g key={n.id} className={`tree-node ${cur ? "current" : ""} ${role === "unbalanced" ? "alert" : ""} ${onSelect ? "cursor-pointer" : ""}`}
                  style={{ transform: `translate(${n.x}px,${n.y}px)`, transition: "transform 350ms ease" }}
                  onClick={(e) => { e.stopPropagation(); if (lastMoved.current < 5) onSelect?.(n.id); }}>
                  <title>{n.label}</title>
                  {violationIds?.has(n.id) && <rect x={-n.nodeWidth / 2 - 8} y={-R - 8} width={n.nodeWidth + 16} height={R * 2 + 16} rx={8} fill="none" strokeWidth={2} strokeDasharray="3 3" className="stroke-destructive"><title>Invariant violation at {n.label}</title></rect>}
                  {(sel || role === "pivot") && <circle r={R + 6} fill="none" strokeWidth={2} strokeDasharray="4 3" className="stroke-selected" />}
                  {n.keys ? <>
                    <rect x={-n.nodeWidth / 2} y={-R} width={n.nodeWidth} height={R * 2} rx={6} strokeWidth={cur ? 3 : 2}
                      className={cur ? "fill-primary stroke-primary" : vis ? "fill-node stroke-success" : "fill-node stroke-edge"} />
                    {(n.keys.length ? n.keys : [null]).map((key, i) => {
                      const cell = n.nodeWidth / Math.max(1, n.keys?.length ?? 1);
                      return <g key={i}>
                        {i > 0 && <line x1={-n.nodeWidth / 2 + i * cell} x2={-n.nodeWidth / 2 + i * cell} y1={-R} y2={R} className="stroke-edge" />}
                        <text x={-n.nodeWidth / 2 + (i + .5) * cell} textAnchor="middle" dy="0.35em" fontSize={12} fontWeight={600} className={`font-mono ${cur ? 'fill-primary-foreground' : 'fill-foreground'}`}>{key ?? '∅'}</text>
                      </g>;
                    })}
                  </> : <>
                    <circle r={R} className="fill-background" />
                    <circle r={R} strokeWidth={cur || role ? 3 : 2}
                      className={n.color ? `${n.color === 'RED' ? 'fill-rb-red' : 'fill-rb-black'} ${cur ? 'stroke-primary' : vis ? 'stroke-success' : 'stroke-rb-outline'}` : cur ? "fill-primary stroke-primary" : vis ? "fill-node stroke-success" : role ? ROLE_CLASS[role] : sel ? "fill-node stroke-selected" : "fill-node stroke-edge"} />
                    <text textAnchor="middle" dy="0.35em" fontSize={n.color ? Math.min(14, 36 / Math.max(1, n.label.length) * 1.5) : fs} fontWeight={600}
                      className={`font-mono ${n.color ? 'fill-rb-foreground' : cur ? "fill-primary-foreground" : vis ? "fill-success" : "fill-foreground"}`}>
                      {n.color ? n.label : n.label.length > 7 ? n.label.slice(0, 6) + "…" : n.label}
                    </text>
                  </>}
                  {badge && (
                    <g transform={`translate(${R - 4},${-R + 2})`}>
                      <title>{badge.title ?? badge.text}</title>
                      <rect x={-13} y={-9} width={26} height={17} rx={8} className={BADGE_CLASS[badge.tone]} />
                      <text textAnchor="middle" dy="0.32em" fontSize={10} fontWeight={700} className="fill-background font-mono">{badge.text}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
      <div className="absolute right-3 bottom-3 flex gap-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="secondary" title="Zoom in" aria-label="Zoom in" onClick={() => zoom(1.25)}><Plus /></Button>
        <Button size="icon" variant="secondary" title="Zoom out" aria-label="Zoom out" onClick={() => zoom(0.8)}><Minus /></Button>
        <Button size="icon" variant="secondary" title="Fit to screen" aria-label="Fit to screen" onClick={fit}><Maximize2 /></Button>
      </div>
      {root && (
        <div className="pointer-events-none absolute top-3 left-3 rounded-md border bg-card/80 px-2 py-1 text-xs text-muted-foreground">
          Drag to pan · Scroll to zoom{onSelect ? " · Click a node to select" : ""}
        </div>
      )}
    </div>
  );
}
