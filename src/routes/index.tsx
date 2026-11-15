import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  GitFork,
  Layers,
  ListOrdered,
  Menu,
  Maximize2,
  Minimize2,
  Network,
  RefreshCcw,
  Scale,
  TreePine,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/lab2/Navbar";
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
import { AdvancedLab, type AdvancedState } from "@/components/treeviz/AdvancedLab";
import { twoThreeAdapter, type TwoThreeNode } from "@/lib/two-three";
import { redBlackAdapter, type RBNode } from "@/lib/red-black";
import {
  binaryInvariants,
  generalInvariants,
  twoThreeInvariants,
  redBlackInvariants,
} from "@/lib/invariants";
import { Invariants, violationIds } from "@/components/treeviz/Invariants";
import { absoluteUrl } from "@/lib/site";
import { LinearVisualizer } from "@/components/linear/LinearVisualizer";
import { HeapVisualizer } from "@/components/linear/HeapVisualizer";
import type { Op } from "@/lib/linear";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TreeViz — Trees, Stacks, Queues & Heaps" },
      {
        name: "description",
        content:
          "Explore trees, stacks, queues and binary heaps with interactive, reversible operation timelines — AVL rotations, 2–3 splits and merges, Red-Black fix-ups, LIFO/FIFO behaviour and heapify swaps.",
      },
      { property: "og:title", content: "TreeViz — Interactive Data Structure Laboratory" },
      {
        property: "og:description",
        content:
          "Visualize traversals, rotations, 2–3 splits and merges, and Red-Black recoloring with reversible operation timelines.",
      },
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

type AppMode =
  Mode | "avl" | "two-three" | "red-black" | "stack" | "queue" | "min-heap" | "max-heap";
const DEFAULT_ALGO: Record<Mode, Algorithm> = { general: "preorder", bst: "inorder" };

function TreeViz() {
  const [mode, setMode] = useState<AppMode>("bst");
  // Separate models per mode — switching never touches another structure.
  const [bstRoot, setBstRoot] = useState<TreeNode | null>(null);
  const [genRoot, setGenRoot] = useState<GNode | null>(null);
  const [avl, setAvl] = useState<{ root: TreeNode | null; op: Operation | null }>({
    root: null,
    op: null,
  });
  const [twoThree, setTwoThree] = useState<AdvancedState<TwoThreeNode>>({
    root: null,
    op: null,
    history: [],
  });
  const [redBlack, setRedBlack] = useState<AdvancedState<RBNode>>({
    root: null,
    op: null,
    history: [],
  });
  const [stack, setStack] = useState<number[]>([]);
  const [stackOp, setStackOp] = useState<Op<number> | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [queueOp, setQueueOp] = useState<Op<number> | null>(null);
  const [minHeap, setMinHeap] = useState<number[]>([]);
  const [minHeapOp, setMinHeapOp] = useState<Op<number> | null>(null);
  const [maxHeap, setMaxHeap] = useState<number[]>([]);
  const [maxHeapOp, setMaxHeapOp] = useState<Op<number> | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [algos, setAlgos] = useState<Record<Mode, Algorithm>>(DEFAULT_ALGO);
  const [speed, setSpeed] = useState(50);
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock page scroll and close on Escape while the mode menu is open.
  useEffect(() => {
    const html = document.documentElement;
    if (menuOpen) {
      html.style.overflow = "hidden";
    } else {
      html.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = "";
    };
  }, [menuOpen]);

  const isLinear =
    mode === "stack" || mode === "queue" || mode === "min-heap" || mode === "max-heap";

  const tm: Mode = mode === "general" ? "general" : "bst";
  const algo = algos[tm];
  const rroot = useMemo(
    () => (mode === "general" ? generalToR(genRoot) : bstToR(bstRoot)),
    [mode, bstRoot, genRoot],
  );
  const info = useMemo(() => treeStats(rroot), [rroot]);
  const mm = useMemo(() => minMax(bstRoot), [bstRoot]);
  const checks = useMemo(
    () => (mode === "general" ? generalInvariants(genRoot) : binaryInvariants(bstRoot)),
    [mode, genRoot, bstRoot],
  );
  const t = useTraversal(mode === "avl" ? null : rroot, tm, algo, speed);

  const notify: Notify = {
    ok: (m) => toast.success(m),
    fail: (m) => toast.error(m),
    info: (m) => toast.info(m),
  };

  const resetAll = () => {
    if (mode === "bst") setBstRoot(null);
    else if (mode === "general") {
      setGenRoot(null);
      setSelectedId(null);
    } else if (mode === "two-three") setTwoThree({ root: null, op: null, history: [] });
    else if (mode === "red-black") setRedBlack({ root: null, op: null, history: [] });
    else if (mode === "stack") {
      setStack([]);
      setStackOp(null);
    } else if (mode === "queue") {
      setQueue([]);
      setQueueOp(null);
    } else if (mode === "min-heap") {
      setMinHeap([]);
      setMinHeapOp(null);
    } else if (mode === "max-heap") {
      setMaxHeap([]);
      setMaxHeapOp(null);
    } else setAvl({ root: null, op: null });
    if (mode === "bst" || mode === "general") setAlgos((a) => ({ ...a, [tm]: DEFAULT_ALGO[tm] }));
    toast("Visualization reset.");
  };
  const loadExample = () => {
    if (mode === "bst") {
      const preset = BST_PRESETS[1];
      if (preset) {
        setBstRoot(buildFrom(preset.values()).root);
        notify.ok("Loaded Balanced-Looking BST.");
      }
    } else if (mode === "general") {
      const preset = GENERAL_PRESETS[0];
      if (preset) {
        setGenRoot(preset.build());
        notify.ok("Loaded Simple Tree.");
      }
    } else if (mode === "stack") {
      setStack([5, 3, 8, 1, 4]);
      notify.ok("Loaded example stack — push 5, 3, 8, 1, 4; the top is 4.");
    } else if (mode === "queue") {
      setQueue([10, 20, 30, 40]);
      notify.ok("Loaded example queue — front is 10, rear is 40.");
    } else if (mode === "min-heap") {
      setMinHeap([1, 3, 2, 7, 8, 4, 5]);
      notify.ok("Loaded example min heap.");
    } else if (mode === "max-heap") {
      setMaxHeap([9, 7, 8, 5, 6, 3, 1]);
      notify.ok("Loaded example max heap.");
    } else {
      const preset = GENERAL_PRESETS[0];
      if (preset) {
        setGenRoot(preset.build());
        notify.ok("Loaded Simple Tree.");
      }
    }
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
    ["Nodes", info.count],
    ["Height (edges)", empty ? "—" : info.height],
    ["Root", info.root ?? "—"],
    ["Leaves", info.leaves],
    ["Max children", empty ? "—" : info.maxChildren],
    ...(mode === "bst"
      ? ([
          ["Min", mm.min ?? "—"],
          ["Max", mm.max ?? "—"],
        ] as [string, string | number][])
      : []),
  ];
  const tabs = [
    ["general", "General Tree", Network],
    ["bst", "Binary Search Tree", GitFork],
    ["avl", "AVL Balancing Lab", Scale],
    ["two-three", "2–3 Tree", Network],
    ["red-black", "Red-Black Tree", GitFork],
    ["stack", "Stack", Layers],
    ["queue", "Queue", ListOrdered],
    ["min-heap", "Min Heap", Minimize2],
    ["max-heap", "Max Heap", Maximize2],
  ] as const;

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <Navbar
          extraActions={
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close mode menu" : "Open mode menu"}
                aria-expanded={menuOpen}
              >
                <Menu className="size-5" />
              </Button>
              <Button variant="outline" onClick={resetAll} title="Clear this mode's tree">
                <RefreshCcw className="size-4 shrink-0" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </>
          }
        />
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setMenuOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            aria-label="Choose a data structure mode"
            className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl z-10 flex flex-col gap-4"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Mode</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close mode menu"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="grid gap-2">
              {tabs.map(([m, label, Icon]) => (
                <Button
                  key={m}
                  role="menuitem"
                  variant={mode === m ? "default" : "ghost"}
                  onClick={() => {
                    setMode(m);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </div>
                  {mode === m && <span className="text-xs text-primary font-medium">Active</span>}
                </Button>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Labs
              </h3>
              <div className="flex flex-col gap-1">
                <Link
                  to="/labs/lab-2"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full justify-between items-center gap-2 rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 text-left"
                >
                  Lab 2: Autocomplete
                </Link>
                <Button
                  variant="ghost"
                  disabled
                  className="w-full justify-between text-sm text-left text-muted-foreground"
                >
                  Lab 1 — Coming soon
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="w-full justify-between text-sm text-left text-muted-foreground"
                >
                  Lab 3 — Coming soon
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  className="w-full justify-between text-sm text-left text-muted-foreground"
                >
                  Lab 4 — Coming soon
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pick a structure to visualize. Your other modes stay intact when you switch.
            </p>
          </div>
        </div>
      )}

      {mode === "two-three" ? (
        <AdvancedLab
          key="two-three"
          adapter={twoThreeAdapter}
          state={twoThree}
          setState={setTwoThree}
          notify={notify}
          speed={speed}
          setSpeed={setSpeed}
          checkInvariants={twoThreeInvariants}
        />
      ) : mode === "red-black" ? (
        <AdvancedLab
          key="red-black"
          adapter={redBlackAdapter}
          state={redBlack}
          setState={setRedBlack}
          notify={notify}
          speed={speed}
          setSpeed={setSpeed}
          checkInvariants={redBlackInvariants}
        />
      ) : mode === "avl" ? (
        <AvlLab
          root={avl.root}
          op={avl.op}
          onOp={(op) => setAvl({ root: op.after, op })}
          onClear={() => setAvl({ root: null, op: null })}
          notify={notify}
          speed={speed}
          setSpeed={setSpeed}
        />
      ) : mode === "stack" ? (
        <LinearVisualizer
          key="stack"
          kind="stack"
          items={stack}
          setItems={setStack}
          op={stackOp}
          setOp={setStackOp}
          speed={speed}
          setSpeed={setSpeed}
          notify={notify}
        />
      ) : mode === "queue" ? (
        <LinearVisualizer
          key="queue"
          kind="queue"
          items={queue}
          setItems={setQueue}
          op={queueOp}
          setOp={setQueueOp}
          speed={speed}
          setSpeed={setSpeed}
          notify={notify}
        />
      ) : mode === "min-heap" ? (
        <HeapVisualizer
          key="min-heap"
          kind="min"
          items={minHeap}
          setItems={setMinHeap}
          op={minHeapOp}
          setOp={setMinHeapOp}
          speed={speed}
          setSpeed={setSpeed}
          notify={notify}
        />
      ) : mode === "max-heap" ? (
        <HeapVisualizer
          key="max-heap"
          kind="max"
          items={maxHeap}
          setItems={setMaxHeap}
          op={maxHeapOp}
          setOp={setMaxHeapOp}
          speed={speed}
          setSpeed={setSpeed}
          notify={notify}
        />
      ) : (
        <main className="tree-workspace mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            {mode === "bst" ? (
              <BstControls
                root={bstRoot}
                setRoot={setBstRoot}
                notify={notify}
                onBalance={balanceThis}
              />
            ) : (
              <GeneralControls
                root={genRoot}
                setRoot={setGenRoot}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                notify={notify}
              />
            )}
            <Section title="Tree information">
              {empty ? (
                <p className="text-sm text-muted-foreground">
                  The tree is empty — no statistics yet.
                </p>
              ) : (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {statRows.map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-secondary px-3 py-2">
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="truncate font-mono text-lg font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Height = edges on the longest root-to-leaf path (a single node has height 0).
              </p>
            </Section>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="tree-stage h-[55vh] min-h-[360px] lg:h-[calc(100vh-300px)]">
              <TreeCanvas
                root={rroot}
                binary={mode === "bst"}
                currentId={t.current?.id ?? null}
                visited={t.visited}
                selectedId={mode === "general" ? selectedId : null}
                violationIds={violationIds(checks)}
                onSelect={mode === "general" ? setSelectedId : undefined}
                empty={
                  <>
                    <div className="rounded-full border bg-card p-4 text-primary">
                      {mode === "bst" ? (
                        <GitFork className="size-8" />
                      ) : (
                        <Network className="size-8" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        Your {mode === "bst" ? "binary search tree" : "general tree"} is empty
                      </h2>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {mode === "bst"
                          ? "Build from a list of numbers, insert values, or load an example."
                          : "Create a root node in the editor, build from JSON, or load an example."}
                      </p>
                    </div>
                    <Button onClick={loadExample}>Load example tree</Button>
                  </>
                }
              />
            </div>
            <section className="panel p-4">
              <TraversalControls
                t={t}
                mode={tm}
                algo={algo}
                setAlgo={(a) => setAlgos((s) => ({ ...s, [tm]: a }))}
                speed={speed}
                setSpeed={setSpeed}
                empty={empty}
              />
            </section>
          </div>

          <aside className="space-y-4 lg:col-span-2 xl:col-span-1">
            <Invariants checks={checks} />
            <AlgorithmPanel
              t={t}
              title={mode === "bst" ? "Algorithm · BST" : "Algorithm · General tree"}
              empty={empty}
            />
          </aside>
        </main>
      )}
    </div>
  );
}
