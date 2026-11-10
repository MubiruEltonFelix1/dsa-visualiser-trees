import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GitFork, Network, RefreshCcw, Scale, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TreeCanvas } from "@/components/treeviz/TreeCanvas";
import { BstControls } from "@/components/treeviz/BstControls";
import { GeneralControls } from "@/components/treeviz/GeneralControls";
import { AvlLab } from "@/components/treeviz/AvlLab";
import { Section, type Notify } from "@/components/treeviz/Section";
import { AlgorithmPanel, TraversalControls, useTraversal } from "@/components/treeviz/Traversal";
import { BST_PRESETS, bstToR, buildFrom, minMax, type TreeNode } from "@/lib/bst";
import { GENERAL_PRESETS, generalToR, type GNode } from "@/lib/general";
import { balanceBST, type Operation } from "@/lib/avl";
import { treeStats, type Algorithm, type Mode } from "@/lib/traversal";
import { AdvancedLab, type AdvancedState } from '@/components/treeviz/AdvancedLab';
import { twoThreeAdapter, type TwoThreeNode } from '@/lib/two-three';
import { redBlackAdapter, type RBNode } from '@/lib/red-black';
import { binaryInvariants, generalInvariants, twoThreeInvariants, redBlackInvariants } from '@/lib/invariants';
import { Invariants, violationIds } from '@/components/treeviz/Invariants';
import { absoluteUrl } from '@/lib/site';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TreeViz — General, BST, AVL, 2–3 & Red-Black Trees" },
      { name: "description", content: "Explore five tree structures with interactive traversals, AVL rotations, 2–3 splits and merges, and Red-Black insertion and deletion fix-ups." },
      { property: "og:title", content: "TreeViz — Interactive Data Structure Laboratory" },
      { property: "og:description", content: "Visualize traversals, rotations, 2–3 splits and merges, and Red-Black recoloring with reversible operation timelines." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:image", content: absoluteUrl("/og-image.png") },
      { property: "og:image:alt", content: "TreeViz — Interactive Data Structure Laboratory" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TreeViz — Interactive Data Structure Laboratory" },
      { name: "twitter:image", content: absoluteUrl("/og-image.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: TreeViz,
});

type AppMode = Mode | "avl" | 'two-three' | 'red-black';
const DEFAULT_ALGO: Record<Mode, Algorithm> = { general: "preorder", bst: "inorder" };

function TreeViz() {
  const [mode, setMode] = useState<AppMode>("bst");
  // Separate models per mode — switching never touches another tree.
  const [bstRoot, setBstRoot] = useState<TreeNode | null>(null);
  const [genRoot, setGenRoot] = useState<GNode | null>(null);
  const [avl, setAvl] = useState<{ root: TreeNode | null; op: Operation | null }>({ root: null, op: null });
  const [twoThree, setTwoThree] = useState<AdvancedState<TwoThreeNode>>({ root: null, op: null, history: [] });
  const [redBlack, setRedBlack] = useState<AdvancedState<RBNode>>({ root: null, op: null, history: [] });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [algos, setAlgos] = useState<Record<Mode, Algorithm>>(DEFAULT_ALGO);
  const [speed, setSpeed] = useState(50);

  const tm: Mode = mode === "general" ? "general" : "bst";
  const algo = algos[tm];
  const rroot = useMemo(() => (mode === "general" ? generalToR(genRoot) : bstToR(bstRoot)), [mode, bstRoot, genRoot]);
  const info = useMemo(() => treeStats(rroot), [rroot]);
  const mm = useMemo(() => minMax(bstRoot), [bstRoot]);
  const checks = useMemo(() => mode === 'general' ? generalInvariants(genRoot) : binaryInvariants(bstRoot), [mode, genRoot, bstRoot]);
  const t = useTraversal(mode === "avl" ? null : rroot, tm, algo, speed);

  const notify: Notify = { ok: (m) => toast.success(m), fail: (m) => toast.error(m), info: (m) => toast.info(m) };

  const resetAll = () => {
    if (mode === "bst") setBstRoot(null);
    else if (mode === "general") { setGenRoot(null); setSelectedId(null); }
    else if (mode === 'two-three') setTwoThree({ root: null, op: null, history: [] });
    else if (mode === 'red-black') setRedBlack({ root: null, op: null, history: [] });
    else setAvl({ root: null, op: null });
    if (mode === 'bst' || mode === 'general') setAlgos((a) => ({ ...a, [tm]: DEFAULT_ALGO[tm] }));
    toast("Visualization reset.");
  };
  const loadExample = () => {
    if (mode === "bst") { const preset = BST_PRESETS[1]; if (preset) { setBstRoot(buildFrom(preset.values()).root); notify.ok("Loaded Balanced-Looking BST."); } }
    else { const preset = GENERAL_PRESETS[0]; if (preset) { setGenRoot(preset.build()); notify.ok("Loaded Simple Tree."); } }
  };
  const balanceThis = () => {
    const op = balanceBST(bstRoot);
    if (op.error) return notify.fail(op.error);
    setAvl({ root: op.after, op });
    setMode("avl");
    notify.ok(`Balanced with ${op.rotations.length} rotation(s). Your original BST is unchanged.`);
  };

  const empty = !rroot;
  const statRows: [string, string | number][] = [
    ["Nodes", info.count], ["Height (edges)", empty ? "—" : info.height], ["Root", info.root ?? "—"],
    ["Leaves", info.leaves], ["Max children", empty ? "—" : info.maxChildren],
    ...(mode === "bst" ? ([["Min", mm.min ?? "—"], ["Max", mm.max ?? "—"]] as [string, string | number][]) : []),
  ];
  const tabs = [["general", "General Tree", Network], ["bst", "Binary Search Tree", GitFork], ["avl", "AVL Balancing Lab", Scale], ['two-three', '2–3 Tree', Network], ['red-black', 'Red-Black Tree', GitFork]] as const;

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-card p-2 text-primary"><TreePine className="size-5" /></div>
            <div>
              <h1 className="text-lg leading-tight font-bold">Tree<span className="text-primary">Viz</span></h1>
              <p className="text-xs text-muted-foreground">Interactive Data Structure Laboratory</p>
            </div>
          </div>
          <div role="tablist" aria-label="Tree type" className="tree-type-tabs flex flex-wrap rounded-lg border bg-card p-1">
            {tabs.map(([m, label, Icon]) => (
              <Button variant="ghost" key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="size-4" />{label}
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={resetAll} title="Clear this mode's tree"><RefreshCcw /> Reset</Button>
        </div>
      </header>

      {mode === 'two-three' ? (
        <AdvancedLab key="two-three" adapter={twoThreeAdapter} state={twoThree} setState={setTwoThree} notify={notify} speed={speed} setSpeed={setSpeed} checkInvariants={twoThreeInvariants} />
      ) : mode === 'red-black' ? (
        <AdvancedLab key="red-black" adapter={redBlackAdapter} state={redBlack} setState={setRedBlack} notify={notify} speed={speed} setSpeed={setSpeed} checkInvariants={redBlackInvariants} />
      ) : mode === "avl" ? (
        <AvlLab root={avl.root} op={avl.op} onOp={(op) => setAvl({ root: op.after, op })} onClear={() => setAvl({ root: null, op: null })}
          notify={notify} speed={speed} setSpeed={setSpeed} />
      ) : (
        <main className="tree-workspace mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            {mode === "bst"
              ? <BstControls root={bstRoot} setRoot={setBstRoot} notify={notify} onBalance={balanceThis} />
              : <GeneralControls root={genRoot} setRoot={setGenRoot} selectedId={selectedId} setSelectedId={setSelectedId} notify={notify} />}
            <Section title="Tree information">
              {empty ? <p className="text-sm text-muted-foreground">The tree is empty — no statistics yet.</p> : (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {statRows.map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-secondary px-3 py-2">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="truncate font-mono text-lg font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Height = edges on the longest root-to-leaf path (a single node has height 0).</p>
            </Section>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="tree-stage h-[55vh] min-h-[360px] lg:h-[calc(100vh-300px)]">
              <TreeCanvas
                root={rroot} binary={mode === "bst"} currentId={t.current?.id ?? null} visited={t.visited}
                selectedId={mode === "general" ? selectedId : null}
                violationIds={violationIds(checks)}
                onSelect={mode === "general" ? setSelectedId : undefined}
                empty={<>
                  <div className="rounded-full border bg-card p-4 text-primary">{mode === "bst" ? <GitFork className="size-8" /> : <Network className="size-8" />}</div>
                  <div>
                    <h2 className="text-xl font-semibold">Your {mode === "bst" ? "binary search tree" : "general tree"} is empty</h2>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      {mode === "bst" ? "Build from a list of numbers, insert values, or load an example." : "Create a root node in the editor, build from JSON, or load an example."}
                    </p>
                  </div>
                  <Button onClick={loadExample}>Load example tree</Button>
                </>}
              />
            </div>
            <section className="panel p-4">
              <TraversalControls t={t} mode={tm} algo={algo} setAlgo={(a) => setAlgos((s) => ({ ...s, [tm]: a }))} speed={speed} setSpeed={setSpeed} empty={empty} />
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
            <Invariants checks={checks} />
            <AlgorithmPanel t={t} title={mode === "bst" ? "Algorithm · BST" : "Algorithm · General tree"} empty={empty} />
          </aside>
        </main>
      )}
    </div>
  );
}
