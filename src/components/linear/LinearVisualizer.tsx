import { useState } from "react";
import { History, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStepper } from "@/hooks/use-stepper";
import { parseValues } from "@/lib/bst";
import { Section, type Notify } from "@/components/treeviz/Section";
import { PlaybackButtons, SpeedSlider, speedToDelay } from "@/components/treeviz/Traversal";
import { Invariants } from "@/components/treeviz/Invariants";
import type { Op } from "@/lib/linear";
import {
  stackPush,
  stackPop,
  stackPeek,
  stackIsEmpty,
  stackClear,
  stackStats,
  stackInvariants,
  STACK_CODE,
  STACK_EXPLAIN,
} from "@/lib/stack";
import {
  queueEnqueue,
  queueDequeue,
  queueFront,
  queueRear,
  queueIsEmpty,
  queueClear,
  queueStats,
  queueInvariants,
  QUEUE_CODE,
  QUEUE_EXPLAIN,
} from "@/lib/queue";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { ExplanationPanel } from "./ExplanationPanel";

type Kind = "stack" | "queue";

interface Props {
  kind: Kind;
  items: number[];
  setItems: (items: number[]) => void;
  op: Op<number> | null;
  setOp: (op: Op<number> | null) => void;
  speed: number;
  setSpeed: (n: number) => void;
  notify: Notify;
}

export function LinearVisualizer({
  kind,
  items,
  setItems,
  op,
  setOp,
  speed,
  setSpeed,
  notify,
}: Props) {
  const isStack = kind === "stack";
  const name = isStack ? "Stack" : "Queue";
  const verb = isStack ? "push" : "enqueue";
  const removeVerb = isStack ? "pop" : "dequeue";

  const [value, setValue] = useState("");
  const [list, setList] = useState("");

  const frames = op?.frames ?? [];
  const st = useStepper(frames.length, {
    min: 0,
    delay: speedToDelay(speed),
    resetKey: op,
    initial: Math.max(0, frames.length - 1),
    autoplayOnReset: true,
  });
  const frame = frames[st.step];
  // Frames are full snapshots; while an operation plays, the shown state follows
  // the frames, otherwise it is the committed structure.
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

  const onAdd = (v: number) => {
    const operation = isStack ? stackPush(items, v) : queueEnqueue(items, v);
    commit(operation);
    setValue("");
    notify.ok(`${name}: ${operation.label}.`);
  };
  const onRemove = () => {
    const operation = isStack ? stackPop(items) : queueDequeue(items);
    commit(operation);
    if (!empty) notify.ok(`${name}: ${operation.label}.`);
  };
  const onInspect = () => {
    const operation = isStack ? stackPeek(items) : queueFront(items);
    setOp(operation);
    if (!empty) notify.info(operation.label);
  };
  const onInspectRear = () => {
    const operation = queueRear(items);
    setOp(operation);
    if (!empty) notify.info(operation.label);
  };
  const onEmpty = () => {
    const operation = isStack ? stackIsEmpty(items) : queueIsEmpty(items);
    setOp(operation);
    notify.info(operation.frames[0]?.title ?? "");
  };
  const onClear = () => {
    setItems([]);
    const operation = isStack ? stackClear(items) : queueClear(items);
    setOp(operation);
    notify.ok(`${name} cleared.`);
  };
  const onBuild = () => {
    const p = parseValues(list);
    if (p.error) {
      notify.fail(p.error);
      return;
    }
    if (!p.values.length) return;
    let current = items;
    for (const v of p.values) {
      const operation = isStack ? stackPush(current, v) : queueEnqueue(current, v);
      current = operation.frames[operation.frames.length - 1]?.state ?? current;
    }
    setItems(current);
    setOp(null);
    setList("");
    notify.ok(`${name} built with ${p.values.length} element(s).`);
  };

  const stats = shown ? (isStack ? stackStats(shown) : queueStats(shown)) : [];
  const checks = isStack ? stackInvariants(shown) : queueInvariants(shown);
  const code = isStack ? STACK_CODE : QUEUE_CODE;
  const explain = isStack ? STACK_EXPLAIN : QUEUE_EXPLAIN;
  const safe = shown ?? [];
  const context = {
    Size: safe.length,
    ...(isStack
      ? { Top: safe.length ? safe[safe.length - 1]! : null }
      : {
          Front: safe.length ? safe[0]! : null,
          Rear: safe.length ? safe[safe.length - 1]! : null,
        }),
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
                  if (v !== null) onAdd(v);
                }}
              />
              <Button
                title={`Add a value to the ${name.toLowerCase()}`}
                onClick={() => {
                  const v = one(value);
                  if (v !== null) onAdd(v);
                }}
              >
                <Plus className="shrink-0" /> {verb.charAt(0).toUpperCase() + verb.slice(1)}
              </Button>
            </div>
            <Button
              variant="secondary"
              disabled={empty}
              title={`Remove from the ${name.toLowerCase()}`}
              onClick={onRemove}
            >
              <Minus className="shrink-0" />{" "}
              {removeVerb.charAt(0).toUpperCase() + removeVerb.slice(1)}
            </Button>
            <Button
              variant="secondary"
              disabled={empty}
              title={`Inspect the ${isStack ? "top" : "front"} element`}
              onClick={onInspect}
            >
              {isStack ? "Peek" : "Front"}
            </Button>
            {!isStack && (
              <Button
                variant="secondary"
                disabled={empty}
                title="Inspect the rear element"
                onClick={onInspectRear}
              >
                Rear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              title="Check whether the structure is empty"
              onClick={onEmpty}
            >
              Is empty
            </Button>
            <Button variant="destructive" disabled={empty} className="w-full" onClick={onClear}>
              <Trash2 className="shrink-0" /> Clear
            </Button>
            <p className="text-xs text-muted-foreground">
              {isStack
                ? "Last in, first out: push goes on top, pop removes from the top."
                : "First in, first out: enqueue joins the rear, dequeue leaves from the front."}
            </p>
          </div>
        </Section>
        <Section title="Build from a list">
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              onBuild();
            }}
          >
            <label className="text-xs text-muted-foreground" htmlFor="linear-list">
              Insert a sequence (comma or space separated)
            </label>
            <Input
              id="linear-list"
              value={list}
              onChange={(e) => setList(e.target.value)}
              aria-label="Build sequence"
              placeholder="5, 3, 8, 1, 4"
              className="font-mono"
            />
            <Button type="submit" className="w-full">
              <Plus /> Build {name}
            </Button>
          </form>
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
          <ArrayVisualizer
            items={shown}
            kind={kind}
            focus={frame?.focus ?? null}
            path={frame?.path ?? []}
          />
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
          code={code}
          explain={explain}
          complexity={
            isStack
              ? [
                  ["Push", "O(1)"],
                  ["Pop", "O(1)"],
                  ["Peek", "O(1)"],
                ]
              : [
                  ["Enqueue", "O(1)"],
                  ["Dequeue", "O(n)"],
                  ["Front / Rear", "O(1)"],
                ]
          }
          emptyNote={`Build a ${name.toLowerCase()} to begin, then push/enqueue, pop/dequeue or peek. Previous Step restores the exact prior state.`}
          context={context}
        />
      </aside>
    </main>
  );
}
