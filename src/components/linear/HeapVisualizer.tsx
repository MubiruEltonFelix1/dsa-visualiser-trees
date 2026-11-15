import { useState } from "react";
import { Database, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStepper } from "@/hooks/use-stepper";
import { parseValues } from "@/lib/bst";
import { heapToR, type HeapKind } from "@/lib/heap";
import {
  heapExtract,
  heapInsert,
  heapPeek,
  heapDelete,
  heapClear,
  heapStats,
  heapCode,
  heapExplain,
} from "@/lib/heap";
import { heapInvariants } from "@/lib/invariants";
import { TreeCanvas } from "@/components/treeviz/TreeCanvas";
import { Section, type Notify } from "@/components/treeviz/Section";
import { PlaybackButtons, SpeedSlider, speedToDelay } from "@/components/treeviz/Traversal";
import { Invariants, violationIds } from "@/components/treeviz/Invariants";
import type { Op } from "@/lib/linear";
import { ExplanationPanel } from "./ExplanationPanel";

interface Props {
  kind: HeapKind;
  items: number[];
  setItems: (items: number[]) => void;
  op: Op<number> | null;
  setOp: (op: Op<number> | null) => void;
  speed: number;
  setSpeed: (n: number) => void;
  notify: Notify;
}

const HEAP_EXAMPLES: Record<HeapKind, number[]> = {
  min: [1, 3, 2, 7, 8, 4, 5],
  max: [9, 7, 8, 5, 6, 3, 1],
};

export function HeapVisualizer({
  kind,
  items,
  setItems,
  op,
  setOp,
  speed,
  setSpeed,
  notify,
}: Props) {
  const name = kind === "min" ? "Min Heap" : "Max Heap";
  const extreme = kind === "min" ? "minimum" : "maximum";
  const [value, setValue] = useState("");
  const [index, setIndex] = useState("");

  const frames = op?.frames ?? [];
  const st = useStepper(frames.length, {
    min: 0,
    delay: speedToDelay(speed),
    resetKey: op,
    initial: Math.max(0, frames.length - 1),
    autoplayOnReset: true,
  });
  const frame = frames[st.step];
  const shown = frame ? frame.state : items;
  const size = shown?.length ?? 0;
  const empty = size === 0;

  const commit = (operation: Op<number>) => {
    setItems(operation.frames[operation.frames.length - 1]?.state ?? items);
    setOp(operation);
  };

  const one = (s: string) => {
    const p = parseValues(s);
    if (p.error) {
      notify.fail(p.error);
      return null;
    }
    if (p.values.length !== 1) {
      notify.fail("Enter exactly one number.");
      return null;
    }
    return p.values[0] ?? null;
  };

  const onInsert = (v: number) => {
    const operation = heapInsert(items, v, kind);
    commit(operation);
    setValue("");
    notify.ok(`${name}: inserted ${v}.`);
  };
  const onExtract = () => {
    const operation = heapExtract(items, kind);
    commit(operation);
    if (!empty) notify.ok(`${name}: extracted ${operation.label}.`);
  };
  const onPeek = () => {
    setOp(heapPeek(items, kind));
    if (!empty) notify.info(`Peek: the root holds ${shown?.[0] ?? "—"} (the ${extreme}).`);
  };
  const onDelete = () => {
    const p = parseValues(index);
    if (p.error || p.values.length !== 1) {
      notify.fail("Enter exactly one index.");
      return;
    }
    const i = p.values[0]!;
    if (i < 0 || i >= items.length) {
      notify.fail(`Index ${i} is out of bounds for a heap of size ${items.length}.`);
      return;
    }
    const operation = heapDelete(items, i, kind);
    commit(operation);
    setIndex("");
    if (!empty) notify.ok(`${name}: deleted ${operation.label}.`);
  };
  const onClear = () => {
    setItems([]);
    setOp(heapClear(kind));
    notify.ok(`${name} cleared.`);
  };
  const onExample = () => {
    setItems(HEAP_EXAMPLES[kind]);
    setOp(null);
    notify.ok(`Loaded example ${name}.`);
  };

  const stats = heapStats(shown ?? []);
  const checks = heapInvariants(shown, kind);
  const context = {
    Size: shown?.length ?? 0,
    Root: shown && shown.length ? shown[0]! : null,
    "Height (edges)": shown?.length ? Math.floor(Math.log2(shown.length)) : "—",
  };

  return (
    <main className="tree-workspace mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="min-w-0 space-y-4">
        <Section title={`${name} operations`}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type="number"
                aria-label="Value"
                placeholder="Value"
                className="flex-1 font-mono"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const v = one(value);
                  if (v !== null) onInsert(v);
                }}
              />
              <Button
                title="Insert a value and animate heapify-up"
                onClick={() => {
                  const v = one(value);
                  if (v !== null) onInsert(v);
                }}
              >
                <Plus className="shrink-0" /> Insert
              </Button>
            </div>
            <Button
              variant="secondary"
              disabled={empty}
              title="Remove the root and animate heapify-down"
              onClick={onExtract}
            >
              <Minus className="shrink-0" /> Extract
            </Button>
            <Button
              variant="secondary"
              disabled={empty}
              title="Inspect the root without removing it"
              onClick={onPeek}
            >
              Peek
            </Button>
            <div className="flex gap-2">
              <Input
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                type="number"
                aria-label="Index"
                placeholder="Index"
                className="w-20 font-mono"
              />
              <Button
                variant="secondary"
                disabled={empty}
                title="Delete the element at the given index"
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
            <Button variant="destructive" disabled={empty} className="w-full" onClick={onClear}>
              <Trash2 className="shrink-0" /> Clear
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={onExample}>
              <Database className="shrink-0 size-4" /> Load example heap
            </Button>
            <p className="text-xs text-muted-foreground">
              Children of index i sit at 2i+1 and 2i+2. The array is a complete binary tree in level
              order.
            </p>
          </div>
        </Section>
        <Section title={`${name} information · shown state`}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-md bg-secondary px-3 py-2">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="break-words font-mono text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="tree-stage h-[55vh] min-h-[360px] lg:h-[calc(100vh-300px)]">
          <TreeCanvas
            root={heapToR(shown ?? [])}
            binary
            currentId={frame?.focus != null ? frame.focus + 1 : null}
            visited={new Set((frame?.path ?? []).map((i) => i + 1))}
            violationIds={violationIds(checks)}
            empty={
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="rounded-full border bg-card p-4 text-primary">
                  <Database className="size-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{name} is empty</h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Insert values to build the heap.
                  </p>
                </div>
              </div>
            }
          />
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto px-2 text-xs">
            {(shown ?? []).map((value, i) => {
              const isFocus = i === (frame?.focus ?? -1);
              const isPath = (frame?.path ?? []).includes(i);
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-muted-foreground">[{i}]</span>
                  <div
                    className={`min-w-[44px] h-9 rounded-md border border-border p-1 font-mono text-sm flex items-center justify-center transition-all duration-300 ${
                      isFocus ? "ring-2 ring-primary" : ""
                    } ${isPath ? "border-selected bg-selected/10" : ""}`}
                  >
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Array (level order) — amber cells are swapped this step
          </p>
        </div>
        <section className="panel space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <PlaybackButtons st={st} disabled={frames.length < 2} />
            <SpeedSlider speed={speed} setSpeed={setSpeed} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-lg bg-secondary px-3 py-2 font-mono">
              Step {frames.length ? st.step + 1 : 0} of {frames.length}
            </span>
            <span className="text-muted-foreground">{op?.label ?? "No operation yet"}</span>
          </div>
          {frames.length > 1 && (
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={st.step}
              onChange={(e) => st.goto(Number(e.target.value))}
              aria-label="Operation timeline"
              className="w-full accent-primary"
            />
          )}
        </section>
      </div>

      <aside className="min-w-0 space-y-4 lg:col-span-2 xl:col-span-1">
        <Invariants checks={checks} label="structure" />
        <ExplanationPanel
          title={`${name} · what's happening`}
          frame={frame ?? null}
          code={heapCode(kind)}
          explain={heapExplain(kind)}
          complexity={[
            ["Insert", "O(log n)"],
            ["Extract", "O(log n)"],
            ["Peek", "O(1)"],
          ]}
          emptyNote={`Build a ${name} to begin, then insert, extract or peek. Previous Step restores the exact prior state.`}
          context={context}
        />
      </aside>
    </main>
  );
}
