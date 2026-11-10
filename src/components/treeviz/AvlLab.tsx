import { useMemo, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Plus, Minus, RotateCcw, RotateCw, Scale, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useStepper } from "@/hooks/use-stepper";
import { bstToR, parseValues, type TreeNode } from "@/lib/bst";
import {
  AVL_EXAMPLES, avlBuild, avlDelete, avlInsert, balanceBST, find, height, inorder, isAVL, loadRaw, manualRotate, nodeInfo, type Operation,
} from "@/lib/avl";
import type { Algorithm } from "@/lib/traversal";
import { TreeCanvas, type Badge } from "./TreeCanvas";
import { Section, type Notify } from "./Section";
import { AlgorithmPanel, PlaybackButtons, SpeedSlider, speedToDelay, TraversalControls, useTraversal } from "./Traversal";
import { binaryInvariants } from '@/lib/invariants';
import { Invariants, violationIds } from './Invariants';

interface Props {
  root: TreeNode | null; op: Operation | null; onOp: (op: Operation) => void; onClear: () => void;
  notify: Notify; speed: number; setSpeed: (n: number) => void;
}

const fmt = (b: number) => (b > 0 ? `+${b}` : `${b}`);
const badgesFor = (t: TreeNode | null) => {
  const m = new Map<number, Badge>();
  for (const i of nodeInfo(t)) m.set(i.id, {
    text: fmt(i.bf), tone: Math.abs(i.bf) > 1 ? "bad" : i.bf > 0 ? "left" : i.bf < 0 ? "right" : "even",
    title: `${i.value}: h(L) = ${i.lh}, h(R) = ${i.rh}, BF = ${fmt(i.bf)}`,
  });
  return m;
};

export function AvlLab({ root, op, onOp, onClear, notify, speed, setSpeed }: Props) {
  const [tab, setTab] = useState<"timeline" | "traversal">("timeline");
  const [algo, setAlgo] = useState<Algorithm>("inorder");
  const [ins, setIns] = useState("");
  const [del, setDel] = useState("");
  const [list, setList] = useState("");
  const [animate, setAnimate] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const frames = op?.frames ?? [];
  const st = useStepper(frames.length, { min: 0, delay: speedToDelay(speed), resetKey: op, initial: Math.max(0, frames.length - 1), autoplayOnReset: true });
  const frame = frames[st.step];
  const shown = tab === "timeline" && frame ? frame.tree : root;
  const rroot = useMemo(() => bstToR(root), [root]);
  const t = useTraversal(rroot, "bst", algo, speed);
  const shownR = useMemo(() => (tab === "traversal" ? rroot : bstToR(shown)), [tab, rroot, shown]);
  const badges = useMemo(() => badgesFor(shown), [shown]);
  const infos = useMemo(() => nodeInfo(shown), [shown]);
  const checks = useMemo(() => binaryInvariants(shown, true), [shown]);
  const balanced = isAVL(root);
  const selNode = root && selected != null ? findById(root, selected) : null;

  const apply = (o: Operation) => {
    if (o.error) return notify.fail(o.error);
    setSelected(null); setTab("timeline"); onOp(o);
  };
  const one = (s: string) => {
    const p = parseValues(s);
    if (p.error) { notify.fail(p.error); return null; }
    if (p.values.length !== 1) { notify.fail("Enter exactly one number."); return null; }
    return p.values[0] ?? null;
  };
  const guard = () => { if (!balanced) { notify.fail("This tree is not AVL-balanced yet — press “Balance tree” first."); return false; } return true; };

  const comparison = op?.before && op.after && op.frames.length > 1 ? op : null;

  return (
    <main className="tree-workspace mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="space-y-4">
        <Section title="Three kinds of tree">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">General tree:</span> any number of children, no ordering rule.</li>
            <li><span className="font-semibold text-foreground">BST:</span> left &lt; node &lt; right, but never rebalances — can degrade to a list (O(n)).</li>
            <li><span className="font-semibold text-foreground">AVL tree:</span> a BST where every node keeps BF = h(left) − h(right) in −1..+1, using rotations. Height stays O(log n).</li>
          </ul>
        </Section>
        <Section title="AVL operations">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input type="number" value={ins} onChange={(e) => setIns(e.target.value)} placeholder="Value" className="font-mono" />
              <Button onClick={() => { const v = one(ins); if (v === null || !guard()) return; if (find(root, v)) return notify.info(`${v} already exists — duplicates are ignored.`); apply(avlInsert(root, v)); setIns(""); }}><Plus /> Insert</Button>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={del} onChange={(e) => setDel(e.target.value)} placeholder="Value" className="font-mono" />
              <Button variant="secondary" disabled={!root} onClick={() => { const v = one(del); if (v === null || !guard()) return; apply(avlDelete(root, v)); setDel(""); }}><Minus /> Delete</Button>
            </div>
            <Input value={list} onChange={(e) => setList(e.target.value)} placeholder="Insert many: 30, 20, 10, 25" className="font-mono" />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={animate} onCheckedChange={(c) => setAnimate(!!c)} /> Animate each insertion and rotation
            </label>
            <Button variant="secondary" className="w-full" onClick={() => {
              const p = parseValues(list); if (p.error) return notify.fail(p.error); if (!guard()) return;
              apply(avlBuild(p.values, root, animate));
            }}>Insert list</Button>
            <div className="flex gap-2">
              <Button className="flex-1" variant={balanced ? "outline" : "default"} disabled={!root} onClick={() => apply(balanceBST(root))}><Scale /> Balance tree</Button>
              <Button variant="destructive" disabled={!root} onClick={() => { setSelected(null); onClear(); }}><Trash2 /> Clear</Button>
            </div>
            {!balanced && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">Not AVL-balanced. Insert/delete are paused until you press “Balance tree”.</p>}
          </div>
        </Section>
        <Section title="Examples">
          <div className="flex flex-wrap gap-1.5">
            {AVL_EXAMPLES.map((ex) => (
              <Button key={ex.label} size="sm" variant="outline" title={ex.values.join(", ")}
                onClick={() => apply(ex.animateInsert ? { ...avlBuild(ex.values, null, true), label: `${ex.label}: insert ${ex.values.join(", ")}` } : loadRaw(ex.values, ex.label))}>
                {ex.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Case examples animate AVL insertion. Skewed and mixed trees load as plain BSTs — then press “Balance tree”.</p>
        </Section>
        <Section title="Manual rotation">
          <p className="mb-2 text-xs text-muted-foreground">Click a node on the canvas, then rotate. This is one structural rotation, not a full AVL rebalance.</p>
          <div className="mb-2 text-sm">Pivot: <span className="font-mono font-semibold text-selected">{selNode?.value ?? "— none —"}</span></div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="flex-1" disabled={!selNode} title="Promote the right child" onClick={() => selNode && apply(manualRotate(root, selNode.value, "left"))}><RotateCcw /> Rotate left</Button>
            <Button size="sm" variant="secondary" className="flex-1" disabled={!selNode} title="Promote the left child" onClick={() => selNode && apply(manualRotate(root, selNode.value, "right"))}><RotateCw /> Rotate right</Button>
          </div>
        </Section>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="tree-stage h-[55vh] min-h-[360px] lg:h-[calc(100vh-300px)]">
          <TreeCanvas
            root={shownR} binary currentId={tab === "traversal" ? t.current?.id ?? null : null}
            visited={tab === "traversal" ? t.visited : new Set()}
            roles={tab === "timeline" ? frame?.roles : undefined} badges={badges}
            violationIds={violationIds(checks)}
            selectedId={selected} onSelect={(id) => { setSelected(id); if (id != null && tab === "timeline" && !st.done) st.goto(frames.length - 1); }}
            empty={<>
              <div className="rounded-full border bg-card p-4 text-primary"><Scale className="size-8" /></div>
              <div><h2 className="text-xl font-semibold">Balancing Lab</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Insert values, or load an LL / RR / LR / RL example to watch AVL rotations step by step.</p></div>
              <Button onClick={() => apply({ ...avlBuild([30, 10, 20], null, true), label: "LR case: insert 30, 10, 20" })}>Load LR example</Button>
            </>}
          />
        </div>
        <section className="panel space-y-4 p-4">
          <div role="tablist" className="flex gap-1 rounded-lg border bg-background p-1 text-sm w-fit">
            {(["timeline", "traversal"] as const).map((k) => (
              <Button variant="ghost" size="sm" key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1 font-medium ${tab === k ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                {k === "timeline" ? "Balancing timeline" : "Traversals"}
              </Button>
            ))}
          </div>
          {tab === "timeline" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <PlaybackButtons st={st} disabled={frames.length < 2} />
                <SpeedSlider speed={speed} setSpeed={setSpeed} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-lg bg-secondary px-3 py-2 font-mono">Step {frames.length ? st.step + 1 : 0} of {frames.length}</span>
                <span className="text-muted-foreground">{op?.label ?? "No operation yet"}</span>
              </div>
              {frames.length > 1 && (
                <input type="range" min={0} max={frames.length - 1} value={st.step} onChange={(e) => st.goto(Number(e.target.value))} className="w-full accent-primary" aria-label="Timeline" />
              )}
              <Legend />
            </div>
          ) : (
            <TraversalControls t={t} mode="bst" algo={algo} setAlgo={setAlgo} speed={speed} setSpeed={setSpeed} empty={!root} />
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
        <Invariants checks={checks} />
        {tab === "traversal" ? <AlgorithmPanel t={t} title="Algorithm · AVL tree" empty={!root} /> : (
          <>
            <Section title="What's happening">
              <h2 className="text-lg font-semibold">{frame?.title ?? "Waiting for an operation"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{frame?.note ?? "Every insertion, deletion or rotation is recorded here as a sequence of tree snapshots you can step through."}</p>
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                {[["LL", "right rotation"], ["RR", "left rotation"], ["LR", "left, then right"], ["RL", "right, then left"]].map(([c, r]) => (
                  <div key={c} className={`rounded-md border px-2 py-1.5 ${frame?.title.startsWith(`${c} case`) ? "border-primary bg-primary/10" : ""}`}>
                    <span className="font-mono font-semibold">{c}</span> <span className="text-muted-foreground">→ {r}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title={`Rotations performed (${op?.rotations.length ?? 0})`}>
              {op?.rotations.length ? (
                <ol className="space-y-1">
                  {op.rotations.map((r, i) => (
                    <li key={i}>
                      <Button variant="ghost" onClick={() => st.goto(r.frame - 1)}
                        className={`h-auto w-full justify-start whitespace-normal rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary ${st.step === r.frame - 1 || st.step === r.frame ? "bg-secondary" : ""}`}>
                        <ArrowLeftRight className="size-3.5 shrink-0 text-primary" /><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>{r.label}
                      </Button>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">No rotations in this operation.</p>}
              <p className="mt-2 text-xs text-muted-foreground">Click a rotation to inspect it.</p>
            </Section>
            {comparison && <Comparison op={comparison} />}
          </>
        )}
        <Section title="Balance factors (shown tree)">
          {infos.length ? (
            <div className="max-h-56 overflow-auto">
              <table className="w-full font-mono text-xs">
                <thead className="text-muted-foreground"><tr><th className="text-left">Node</th><th>h(L)</th><th>h(R)</th><th>BF</th></tr></thead>
                <tbody>{infos.map((i) => (
                  <tr key={i.id} className={Math.abs(i.bf) > 1 ? "text-destructive" : ""}>
                    <td>{i.value}</td><td className="text-center">{i.lh}</td><td className="text-center">{i.rh}</td><td className="text-center font-semibold">{fmt(i.bf)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground">Empty tree.</p>}
          <p className="mt-2 text-xs text-muted-foreground">Height counts edges (leaf = 0, empty = −1). BF = h(L) − h(R).</p>
        </Section>
        <Section title="Complexity">
          <ul className="space-y-1 text-xs">
            {[["AVL search", "O(log n)"], ["AVL insertion", "O(log n)"], ["AVL deletion", "O(log n)"], ["Single rotation", "O(1) pointer changes"], ["AVL height", "O(log n)"], ["Unbalanced BST ops", "O(n) worst case"]].map(([k, v]) => (
              <li key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">These are algorithm costs. Drawing and animating the tree takes extra time that grows with tree size.</p>
        </Section>
      </aside>
    </main>
  );
}

function findById(n: TreeNode | null, id: number): TreeNode | null {
  if (!n) return null;
  if (n.id === id) return n;
  return findById(n.left, id) ?? findById(n.right, id);
}

function Legend() {
  const items: [string, string][] = [["border-destructive", "Unbalanced"], ["border-selected border-dashed", "Pivot"], ["border-primary bg-primary/30", "Promoted"], ["border-subtree", "Moved subtree"], ["border-success", "Balanced"]];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(([c, l]) => <span key={l} className="flex items-center gap-1.5"><span className={`size-3 rounded-full border-2 ${c}`} />{l}</span>)}
      <span className="flex items-center gap-1.5">BF badge: <span className="text-success">0</span><span className="text-heavy-left">+1 left</span><span className="text-heavy-right">−1 right</span><span className="text-destructive">±2 bad</span></span>
    </div>
  );
}

function Comparison({ op }: { op: Operation }) {
  const b = op.before, a = op.after;
  if (!b || !a) return null;
  const bi = inorder(b).join(", "), ai = inorder(a).join(", ");
  const bfs = (t: TreeNode) => nodeInfo(t).map((i) => `${i.value}:${fmt(i.bf)}`).join(" ");
  const ok = isAVL(a);
  const rows: [string, string, string][] = [
    ["Height", String(height(b)), String(height(a))],
    ["Nodes", String(nodeInfo(b).length), String(nodeInfo(a).length)],
    ["AVL property", isAVL(b) ? "holds" : "violated", ok ? "holds" : "violated"],
  ];
  return (
    <Section title="Before vs after">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground"><tr><th className="text-left">&nbsp;</th><th>Before</th><th>After</th></tr></thead>
        <tbody>{rows.map(([k, x, y]) => <tr key={k}><td className="text-muted-foreground">{k}</td><td className="text-center font-mono">{x}</td><td className="text-center font-mono">{y}</td></tr>)}</tbody>
      </table>
      <div className="mt-2 text-sm">Rotations: <span className="font-mono">{op.rotations.length}</span></div>
      <div className="mt-2 space-y-1 text-xs">
        <div><span className="text-muted-foreground">BF before: </span><span className="font-mono break-words">{bfs(b)}</span></div>
        <div><span className="text-muted-foreground">BF after: </span><span className="font-mono break-words">{bfs(a)}</span></div>
        <div><span className="text-muted-foreground">Inorder before: </span><span className="font-mono break-words">{bi}</span></div>
        <div><span className="text-muted-foreground">Inorder after: </span><span className="font-mono break-words">{ai}</span></div>
      </div>
      <div className={`mt-3 flex items-center gap-2 text-sm ${bi === ai ? "text-success" : "text-destructive"}`}>
        {bi === ai ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {bi === ai ? "Inorder sequence identical — BST order preserved" : "Inorder sequence changed!"}
      </div>
      <div className={`mt-1 flex items-center gap-2 text-sm ${ok ? "text-success" : "text-destructive"}`}>
        {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        {ok ? "Every node has BF in −1..+1" : "Some nodes are still unbalanced"}
      </div>
    </Section>
  );
}
