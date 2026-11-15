"use client";

import { useMemo, useState } from "react";
import { BarChart2, Calculator, Cpu, ShieldAlert, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const COMPLEXITY_ROWS = [
  { op: "sortDictionary", complexity: "O(N log N)", note: "One-time cost to sort the dictionary alphabetically." },
  { op: "firstIndexOf", complexity: "O(log N)", note: "Boundary search — halves the interval each step." },
  { op: "lastIndexOf", complexity: "O(log N)", note: "Boundary search — halves the interval each step." },
  { op: "numberOfMatches", complexity: "O(log N)", note: "Arithmetic on the two boundaries, never an M-iteration." },
  { op: "allMatches", complexity: "O(log N + M log M)", note: "Boundary searches plus sorting only the M matches." },
];

function log2Ceil(n: number) {
  return n <= 1 ? 0 : Math.ceil(Math.log2(n));
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export function ComplexityLab() {
  const [n, setN] = useState(1000);
  const [m, setM] = useState(50);

  const bounds = useMemo(() => {
    const linear = n;
    const boundaries = 2 * log2Ceil(Math.max(1, n));
    const sortWhole = n * log2Ceil(Math.max(1, n));
    const sortMatches = m * log2Ceil(Math.max(1, m));
    return { linear, boundaries, sortWhole, sortMatches };
  }, [n, m]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5" />
              N and M
            </CardTitle>
            <CardDescription>
              N = total number of terms in the dictionary. M = number of terms matching the current
              prefix. Move the sliders to watch how each operation grows.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Dictionary size (N)</span>
                  <span className="text-sm font-mono font-semibold">{formatNumber(n)}</span>
                </div>
                <Slider value={[n]} min={10} max={100_000} step={10} onValueChange={([v]) => setN(v ?? n)} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Matching terms (M)</span>
                  <span className="text-sm font-mono font-semibold">{formatNumber(m)}</span>
                </div>
                <Slider value={[m]} min={1} max={Math.min(1000, n)} step={1} onValueChange={([v]) => setM(Math.min(v ?? m, n))} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5" />
              Approximate operation count at current N and M
            </CardTitle>
            <CardDescription>
              These are illustrative counts, not measured runtimes. They show relative growth, not
              benchmarks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Linear scan", value: bounds.linear, desc: "checks up to N terms" },
                { label: "Boundary searches", value: bounds.boundaries, desc: "2 × log₂ N" },
                { label: "Sort whole dictionary", value: bounds.sortWhole, desc: "N log N each time" },
                { label: "Sort matches only", value: bounds.sortMatches, desc: "M log M" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border bg-secondary/50 p-3">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="mt-1 font-mono text-lg font-semibold">{formatNumber(c.value)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="size-5" />
              Complexity of each operation
            </CardTitle>
            <CardDescription>Theoretical complexity classes. Distinguish these from observed runtime.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 text-muted-foreground font-medium">Operation</th>
                    <th className="pb-2 text-muted-foreground font-medium">Complexity</th>
                    <th className="pb-2 text-muted-foreground font-medium">What it means</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLEXITY_ROWS.map((row) => (
                    <tr key={row.op} className="border-b border-border/50">
                      <td className="py-3 font-mono font-semibold">{row.op}</td>
                      <td className="py-3 font-mono font-semibold text-primary">{row.complexity}</td>
                      <td className="py-3 text-muted-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-5" />
              Why it grows this way
            </CardTitle>
            <CardDescription>Short explanations for each complexity class.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex size-5 items-center rounded-md border bg-secondary p-2 text-success">
                <Cpu className="size-4" />
              </div>
              <div>
                <div className="font-semibold">O(log N) — halving.</div>
                <div className="text-sm text-muted-foreground">
                  Each comparison throws away half of the remaining interval, so the number of steps
                  grows logarithmically with N, not linearly.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-5 items-center rounded-md border bg-secondary p-2 text-accent-foreground">
                <Cpu className="size-4" />
              </div>
              <div>
                <div className="font-semibold">O(N log N) — one-time sort.</div>
                <div className="text-sm text-muted-foreground">
                  Sorting the dictionary once is the only cost that touches every term. Later queries
                  reuse that sorted order.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-5 items-center rounded-md border bg-secondary p-2 text-selected">
                <Cpu className="size-4" />
              </div>
              <div>
                <div className="font-semibold">O(M log M) — matches only.</div>
                <div className="text-sm text-muted-foreground">
                  Only the M matching terms are re-sorted by weight. When M is much smaller than N,
                  this is far cheaper than re-sorting the whole dictionary.
                </div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex size-5 shrink-0 items-center rounded-md border bg-secondary p-2 text-destructive">
                <ShieldAlert className="size-4" />
              </div>
              <div className="text-sm text-muted-foreground">
                numberOfMatches must not iterate through all M matches — it is pure arithmetic on the
                two boundary indices: last − first + 1.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
