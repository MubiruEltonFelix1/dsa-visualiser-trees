"use client";

import { useCallback, useMemo, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStepper } from "@/hooks/use-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_TERMS,
  firstIndexOf,
  lastIndexOf,
  makeTermToKeyComparator,
  ordinaryBinarySearch,
  sortDictionaryAlphabetically,
  type SearchFrame,
  type Term,
} from "@/lib/lab2";

const SEED_TERMS: Term[] = [
  { id: "s1", word: "apple", weight: 10 },
  { id: "s2", word: "banana", weight: 20 },
  { id: "s3", word: "banana", weight: 30 },
  { id: "s4", word: "banana", weight: 40 },
  { id: "s5", word: "carrot", weight: 50 },
];

type Mode = "ordinary" | "first" | "last";

const MODE_LABELS: Record<Mode, string> = {
  ordinary: "Ordinary binary search",
  first: "firstIndexOf — leftmost match",
  last: "lastIndexOf — rightmost match",
};

const INVARIANTS: Record<Mode, string> = {
  ordinary: "Stop at the first match found; report its index.",
  first:
    "The first matching index is still somewhere in the unresolved left portion — or it is the saved answer.",
  last:
    "The last matching index is still somewhere in the unresolved right portion — or it is the saved answer.",
};

export function BinarySearchVisualizer() {
  const [mode, setMode] = useState<Mode>("first");
  const [key, setKey] = useState("banana");
  const [speed, setSpeed] = useState(600);

  const terms = useMemo(() => sortDictionaryAlphabetically([...SEED_TERMS]), []);
  const cmp = useMemo(() => makeTermToKeyComparator("word", key), [key]);

  const trace = useMemo(() => {
    if (mode === "ordinary") return ordinaryBinarySearch(terms, key, cmp);
    if (mode === "first") return firstIndexOf(terms, key, cmp);
    return lastIndexOf(terms, key, cmp);
  }, [terms, key, mode, cmp]);

  const stepper = useStepper(trace.frames.length, {
    delay: speed,
    resetKey: [mode, key, JSON.stringify(terms)],
  });

  const frame = trace.frames[stepper.step];
  const lastFrame = trace.frames[trace.frames.length - 1];

  const goToFinal = () => {
    stepper.goto(trace.frames.length - 1);
  };

  const lowColor = "border-l-4 border-l-primary";
  const midColor = "border-l-4 border-l-accent";
  const highColor = "border-l-4 border-l-selected";
  const eliminatedColor = "bg-destructive/10";
  const answerColor = "bg-success/10";
  const matchColor = "bg-accent/20";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Binary Search Visualizer
            </CardTitle>
            <CardDescription>
              Replay real algorithm state one step at a time. Previous Step restores the actual
              previous frame — nothing is faked.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Mode</label>
                <div className="flex flex-col gap-1">
                  <Button
                    key="ordinary"
                    onClick={() => setMode("ordinary")}
                    variant={mode === "ordinary" ? "default" : "outline"}
                    className="text-sm text-left"
                  >
                    Ordinary
                  </Button>
                  <Button
                    key="first"
                    onClick={() => setMode("first")}
                    variant={mode === "first" ? "default" : "outline"}
                    className="text-sm text-left"
                  >
                    firstIndexOf
                  </Button>
                  <Button
                    key="last"
                    onClick={() => setMode("last")}
                    variant={mode === "last" ? "default" : "outline"}
                    className="text-sm text-left"
                  >
                    lastIndexOf
                  </Button>
                </div>
              </div>
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">Search key</label>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">Speed (ms)</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">&nbsp;</label>
                <Button onClick={goToFinal} size="sm">
                  Jump to final
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={stepper.reset} variant="outline" size="sm" disabled={stepper.atStart}>
                <RotateCcw className="size-3" /> Reset
              </Button>
              <Button
                onClick={stepper.playing ? stepper.pause : stepper.play}
                size="sm"
                disabled={stepper.done && stepper.step >= stepper.length - 1}
              >
                {stepper.playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                {stepper.playing ? " Pause" : " Start"}
              </Button>
              <Button onClick={stepper.prev} size="sm" disabled={stepper.atStart} className="px-3">
                <SkipBack className="size-3" /> Previous
              </Button>
              <Button onClick={stepper.next} size="sm" disabled={stepper.done} className="px-3">
                <SkipForward className="size-3" /> Next
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                Step {stepper.step === -1 ? 0 : stepper.step + 1} of {Math.max(trace.frames.length, 1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Array visualization */}
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-4" />
              Sorted dictionary — low / mid / high
            </CardTitle>
            <CardDescription>
              Each cell is one term. Colors mark the current search boundaries and the eliminated
              half. The saved answer is highlighted when a match is found.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="inline-flex size-5 items-center rounded-sm border border-primary bg-primary/10 px-1.5 text-[10px] font-mono">low</span>
                <span className="inline-flex size-5 items-center rounded-sm border border-accent bg-accent/10 px-1.5 text-[10px] font-mono">mid</span>
                <span className="inline-flex size-5 items-center rounded-sm border border-selected bg-selected/10 px-1.5 text-[10px] font-mono">high</span>
                <span className="inline-flex size-5 items-center rounded-sm border border-success bg-success/10 px-1.5 text-[10px] font-mono">answer</span>
                <span className="inline-flex size-5 items-center rounded-sm border border-destructive/50 bg-destructive/10 px-1.5 text-[10px] font-mono">eliminated</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{MODE_LABELS[mode]}</span>
              </div>
              <div className="flex items-end gap-1 px-2 min-h-[120px]">
                {terms.map((t, i) => {
                  const isLow = frame ? i === frame.low : false;
                  const isMid = frame ? i === frame.mid : false;
                  const isHigh = frame ? i === frame.high : false;
                  const isAnswer = frame ? i === frame.answer : false;
                  const eliminated =
                    frame && frame.eliminated !== "none"
                      ? (frame.eliminated === "left" ? i <= frame.low : i >= frame.high)
                      : false;
                  const matched =
                    frame && frame.cmp === 0 && i === frame.mid;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-all duration-300",
                        eliminated && eliminatedColor,
                        isAnswer && answerColor,
                        matched && matchColor,
                      )}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-md border flex items-center justify-center font-mono text-xs font-semibold border-transparent",
                            isLow && lowColor,
                            isMid && midColor,
                            isHigh && highColor,
                            isAnswer && "border-success bg-success/20",
                          )}
                        >
                          {t.word}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{i}</div>
                        {isLow && <div className="text-[10px] text-primary font-semibold">▼ low</div>}
                        {isMid && <div className="text-[10px] text-accent-foreground font-semibold">▼ mid</div>}
                        {isHigh && <div className="text-[10px] text-selected font-semibold">▼ high</div>}
                        {isAnswer && <div className="text-[10px] text-success font-semibold">▲ answer</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {frame && frame.eliminated !== "none" && (
                <div className="flex justify-center mt-1 text-xs text-destructive/70">
                  Eliminated:{" "}
                  {frame.eliminated === "left"
                    ? `indices ≤ ${frame.mid} (left half)`
                    : `indices ≥ ${frame.mid} (right half)`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step info */}
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-4" />
              Step information
            </CardTitle>
            <CardDescription>The real comparator result and region decision at this step.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Current step</span>
                <div className="font-mono text-lg font-semibold">
                  {frame ? frame.step : 0}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Low / Mid / High</span>
                <div className="font-mono text-lg font-semibold">
                  {frame ? `${frame.low} / ${frame.mid ?? "—"} / ${frame.high}` : "— / — / —"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Search key</span>
                <div className="font-mono text-lg font-semibold">"{frame ? frame.key : key}"</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Comparator result</span>
                <div className="font-mono text-lg font-semibold">
                  {frame ? (frame.cmp === null ? "—" : String(frame.cmp)) : "—"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Eliminated region</span>
                <div className="font-mono text-sm font-semibold">
                  {frame ? (frame.eliminated === "none" ? "none" : frame.eliminated) : "—"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Saved answer</span>
                <div className="font-mono text-lg font-semibold">
                  {frame ? (frame.answer === null ? "none" : terms[frame.answer]?.word ?? "—") : "—"}
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-xs text-muted-foreground">Done</span>
                <div className="font-mono text-lg font-semibold">
                  {frame ? String(frame.done) : "false"}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Loop invariant</div>
              <div className="text-sm">{INVARIANTS[mode]}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {frame && frame.cmp === 0 && mode === "first"
                  ? "Match saved; continuing left to find an earlier one."
                  : frame && frame.cmp === 0 && mode === "last"
                  ? "Match saved; continuing right to find a later one."
                  : frame && frame.cmp === 0
                  ? "Match found — ordinary search stops here."
                  : frame && frame.cmp !== null
                  ? frame.cmp < 0
                    ? "mid is below the key — discard the left half."
                    : "mid is above the key — discard the right half."
                  : "Search beginning."}
              </div>
            </div>

            {frame && frame.done && frame.answer !== null && (
              <div className="mt-3 rounded-lg border border-success bg-success/10 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success font-semibold">Result:</span>
                  {MODE_LABELS[mode]} found index{" "}
                  <span className="font-mono font-semibold">{frame.answer}</span>{" "}
                  ({terms[frame.answer]?.word}). {mode !== "ordinary" && "The search did not stop at the first match — it kept narrowing until the boundary was certain."}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Separator orientation="vertical" className="h-4" />
              Why binary search works here
            </CardTitle>
            <CardDescription>The dictionary must be sorted alphabetically for the half-discard to be valid.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Dictionary (sorted alphabetically):</div>
              <div className="flex gap-2">
                {terms.map((t) => (
                  <span key={t.id} className="rounded-md border border-input bg-card px-2 py-1 text-xs font-mono">
                    "{t.word}"
                  </span>
                ))}
              </div>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                Because the list is sorted, if the middle term is below the key, every term to its
                left is also below — the whole left half can be discarded.
              </li>
              <li>
                If the middle term is above the key, every term to its right is above — discard the
                right half.
              </li>
              <li>
                Ordinary search stops at the first match. firstIndexOf and lastIndexOf keep going
                past a match to pin down the exact boundary — that is what makes prefix ranges
                possible.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
