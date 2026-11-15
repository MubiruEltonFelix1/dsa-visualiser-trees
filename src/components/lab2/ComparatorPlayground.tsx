"use client";

import { useMemo, useState } from "react";
import { Sliders, GitCompare, Lightbulb, Slice } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CITY_TERMS,
  lexicographicTermCompare,
  makePrefixTermCompare,
  reverseWeightTermCompare,
  sortTerms,
  type Cmp,
  type Term,
} from "@/lib/lab2";

type Mode = "lexicographic" | "reverse-weight" | "prefix";

const MODES: { value: Mode; label: string; desc: string; teaches: string }[] = [
  {
    value: "lexicographic",
    label: "Case-insensitive lexicographic",
    desc: "Compares whole words only; ignores weight.",
    teaches: "Used to sort the dictionary alphabetically — the one-time order that makes prefixes contiguous.",
  },
  {
    value: "reverse-weight",
    label: "Reverse weight order",
    desc: "Highest weight first; ignores word.",
    teaches: "Used to rank only the matching subset — never the whole dictionary.",
  },
  {
    value: "prefix",
    label: "Prefix order",
    desc: "Compares only the first k characters, case-insensitively.",
    teaches: "Used by binary search to decide whether a term starts with the typed prefix.",
  },
];

function InsightCallout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-accent/50 bg-accent/10 p-4">
      <div className="flex items-start gap-2 mb-2">
        <Lightbulb className="size-4 text-accent-foreground shrink-0 mt-0.5" />
        <span className="text-xs font-semibold text-accent-foreground uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-accent-foreground/90 leading-relaxed">{body}</p>
    </div>
  );
}

export function ComparatorPlayground() {
  const [mode, setMode] = useState<Mode>("lexicographic");
  const [k, setK] = useState(2);
  const [terms, setTerms] = useState<Term[]>(() => [
    ...CITY_TERMS.filter((t) => /^[KMN]/i.test(t.word)),
  ]);
  const [item, setItem] = useState({ word: "", weight: "" });
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [secondPick, setSecondPick] = useState<string | null>(null);
  const [sorted, setSorted] = useState<Term[]>([]);
  const [result, setResult] = useState<{ cmp: Cmp; a: Term; b: Term } | null>(null);

  const comparator = useMemo(() => {
    if (mode === "prefix") return makePrefixTermCompare(k);
    if (mode === "reverse-weight") return reverseWeightTermCompare;
    return lexicographicTermCompare;
  }, [mode, k]);

  const sortedMemo = useMemo(() => sortTerms([...terms], comparator), [terms, comparator]);

  const handleSort = () => {
    setSorted(sortedMemo);
  };

  const addItem = () => {
    const check = (() => {
      const w = Number(item.weight);
      if (!item.word.trim()) return "A term must have a nonempty word.";
      if (!Number.isFinite(w) || w < 0) return "Weight must be a nonnegative number.";
      return null;
    })();
    if (check) {
      alert(check);
      return;
    }
    setTerms((ts) => [...ts, { id: Math.random().toString(36).slice(2, 9), word: item.word.trim(), weight: Number(item.weight) }]);
    setItem({ word: "", weight: "" });
  };

  const deleteItem = (id: string) => setTerms((ts) => ts.filter((t) => t.id !== id));

  const pick = (id: string) => {
    if (firstPick === null) {
      setFirstPick(id);
    } else if (secondPick === null && id !== firstPick) {
      setSecondPick(id);
    }
  };

  const clearPicks = () => {
    setFirstPick(null);
    setSecondPick(null);
    setResult(null);
  };

  const comparePicked = () => {
    if (!firstPick || !secondPick) return;
    const a = sorted.find((t) => t.id === firstPick);
    const b = sorted.find((t) => t.id === secondPick);
    if (!a || !b) return;
    setResult({ cmp: comparator(a, b), a, b });
  };

  const cmpLabel = (cmp: Cmp) => {
    if (cmp < 0) return "comes before";
    if (cmp > 0) return "comes after";
    return "compares equal";
  };

  const modeInfo = MODES.find((m) => m.value === mode);

  const equalUnderPrefix =
    mode === "prefix" &&
    result &&
    result.cmp === 0 &&
    result.a.word.toLowerCase().slice(0, k) === result.b.word.toLowerCase().slice(0, k) &&
    result.a.word.toLowerCase() !== result.b.word.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="size-5" />
              Comparator Playground
            </CardTitle>
            <CardDescription>
              A comparator decides how any two terms are ordered. The same list looks completely
              different under each comparator — and each mode has a specific job in autocomplete.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Comparator</Label>
                <div className="flex flex-col gap-1">
                  {MODES.map((m) => (
                    <Button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      variant={mode === m.value ? "default" : "outline"}
                      className="text-sm text-left"
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{modeInfo?.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  Teaches: {modeInfo?.teaches}
                </p>
              </div>
              {mode === "prefix" ? (
                <div className="space-y-2 flex h-full items-end">
                  <Label htmlFor="cmp-k">k (prefix length)</Label>
                  <Input id="cmp-k" type="number" value={k} onChange={(e) => setK(Math.max(1, Number(e.target.value) || 1))} className="w-16" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only the first k characters are compared — so {"apple" < "k" ? "apply" : "apply"} and {"apricot" < "k" ? "apply" : "apricot"} tie at k = 2.
                  </p>
                </div>
              ) : null}
              <div className="space-y-2 flex h-full items-end">
                <Label>Sorted using this comparator</Label>
                <Button onClick={handleSort} disabled={sortedMemo.length === 0}>
                  Sort
                </Button>
              </div>
              <div className="space-y-2 flex h-full items-end">
                <Label>Clear comparison</Label>
                <Button onClick={clearPicks} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Terms (editable)</div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-input bg-input/10 p-2 space-y-1">
                  {terms.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-2">No terms yet.</div>
                  ) : (
                    terms.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => pick(t.id)}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-2 py-1.5 text-xs cursor-pointer select-none transition-colors hover:bg-accent/30",
                          (firstPick === t.id || secondPick === t.id) && "border-primary bg-primary/10",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.word}</span>
                          <span className="text-muted-foreground font-mono">{t.weight}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {firstPick === t.id && <span className="text-xs text-primary">1</span>}
                          {secondPick === t.id && <span className="text-xs text-accent-foreground">2</span>}
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); deleteItem(t.id); }} className="px-1" variant="destructive" title="Remove">
                            ×
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="add-word" className="text-xs">Word</Label>
                    <Input id="add-word" value={item.word} onChange={(e) => setItem({ ...item, word: e.target.value })} placeholder="Kampala" className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="add-weight" className="text-xs">Weight</Label>
                    <Input id="add-weight" type="number" value={item.weight} onChange={(e) => setItem({ ...item, weight: e.target.value })} placeholder="100" className="text-xs w-20" />
                  </div>
                  <div className="flex h-[calc(100%-4px)] items-end">
                    <Button onClick={addItem} size="sm" className="h-8 px-3">
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-64 flex-shrink-0 rounded-lg border bg-panel p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <GitCompare className="size-4" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compare two terms</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">Select two rows above, then click Compare.</div>
                <Button
                  onClick={comparePicked}
                  disabled={!(firstPick && secondPick)}
                  className="w-full text-sm mb-2"
                >
                  Compare
                </Button>
                {result && (
                  <div className="rounded-md border bg-secondary/40 p-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Result</div>
                    <div className="flex items-baseline gap-1 text-sm">
                      <span className="font-mono font-semibold">{result.a.word}</span>{" "}
                      <span className="text-muted-foreground">{cmpLabel(result.cmp)}</span>{" "}
                      <span className="font-mono font-semibold">{result.b.word}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      Comparator value: <span className="font-mono font-semibold">{result.cmp}</span>{" "}
                      <span className="text-muted-foreground">(negative = before, zero = equal, positive = after)</span>
                    </div>
                    {equalUnderPrefix && (
                      <div className="mt-2 rounded-md border border-accent/50 bg-accent/10 p-2 text-xs text-accent-foreground">
                        Two different words compare equal under the prefix comparator — both start with{" "}
                        <span className="font-semibold">{result.a.word.slice(0, k)}</span>.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Slice className="size-5" />
              Equality is relative to the comparator
            </CardTitle>
            <CardDescription>
              Two different words can compare as equal under one comparator but not another. That is
              not a bug — it is the point of having different comparators for different jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border bg-secondary/50 p-3 text-sm">
              <div className="mb-2">Try this:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select "Prefix order" and set k = 2.</li>
                <li>Add "Kampala" (weight 100) and "Kansas" (weight 90).</li>
                <li>Compare them. Result: zero — equal under this comparator.</li>
                <li>Switch to "Case-insensitive lexicographic": they no longer compare equal.</li>
              </ul>
            </div>
            <InsightCallout
              title="Why equality is relative"
              body={
                "Under prefix order with k = 2, \"Kampala\" and \"Kansas\" both begin with \"Ka\", so " +
                "they compare equal — they occupy the same prefix bucket. Binary search uses this to " +
                "treat every term starting with \"Ka\" as a match for the prefix \"Ka\". Switch to " +
                "lexicographic order and they differ again, because full words are compared."
              }
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Lexicographic:</div>
                <div className="text-[10px] text-muted-foreground">Compares whole words. Ignores weight.</div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Reverse weight:</div>
                <div className="text-[10px] text-muted-foreground">Compares weights only. Ignores words.</div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Prefix:</div>
                <div className="text-[10px] text-muted-foreground">Same first k chars ⇒ equal.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
