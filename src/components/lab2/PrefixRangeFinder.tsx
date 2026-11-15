"use client";

import { useMemo, useState } from "react";
import { Search, LayoutList, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  findPrefixRange,
  makeTermToKeyComparator,
  sortDictionaryAlphabetically,
  type Term,
} from "@/lib/lab2";

const PREFIX_DICTIONARY: Term[] = [
  { id: "p1", word: "apple", weight: 10 },
  { id: "p2", word: "application", weight: 8 },
  { id: "p3", word: "apply", weight: 6 },
  { id: "p4", word: "banana", weight: 20 },
  { id: "p5", word: "band", weight: 9 },
  { id: "p6", word: "car", weight: 5 },
  { id: "p7", word: "camera", weight: 7 },
  { id: "p8", word: "candle", weight: 4 },
  { id: "p9", word: "cat", weight: 3 },
  { id: "p10", word: "dog", weight: 2 },
];

export function PrefixRangeFinder() {
  const [prefix, setPrefix] = useState("ca");

  const sorted = useMemo(() => sortDictionaryAlphabetically([...PREFIX_DICTIONARY]), []);
  const range = useMemo(() => findPrefixRange(sorted, prefix), [sorted, prefix]);
  const cmp = useMemo(() => makeTermToKeyComparator("prefix", prefix), [prefix]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5" />
              Prefix Range Finder
            </CardTitle>
            <CardDescription>
              Prefix matches form one contiguous interval because the dictionary is sorted
              alphabetically. Change the prefix and watch the range move.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">Prefix</label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. ca"
                  className="w-32"
                />
                <div className="text-xs text-muted-foreground">
                  Comparator: first {prefix.length} characters, case-insensitive
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setPrefix("ca")} size="sm" variant={prefix === "ca" ? "default" : "outline"}>
                  "ca"
                </Button>
                <Button onClick={() => setPrefix("ban")} size="sm" variant={prefix === "ban" ? "default" : "outline"}>
                  "ban"
                </Button>
                <Button onClick={() => setPrefix("z")} size="sm" variant="outline">
                  "z" (none)
                </Button>
                <Button onClick={() => setPrefix("")} size="sm" variant="outline">
                  "" (empty)
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Sorted dictionary:</span>
              <div className="flex flex-wrap gap-2 ml-auto">
                {sorted.map((t, i) => {
                  const inRange =
                    range.first !== null && range.last !== null && i >= range.first && i <= range.last;
                  return (
                    <span
                      key={t.id}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-mono transition-colors",
                        inRange
                          ? "border-success bg-success/20 text-success"
                          : "border-border bg-secondary text-muted-foreground",
                      )}
                    >
                      "{t.word}"
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Range info */}
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="size-5" />
              Range result
            </CardTitle>
            <CardDescription>numberOfMatches is computed from the two boundaries — never by iterating the matches.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">First matching index</div>
                <div className="mt-1 font-mono text-lg font-semibold">
                  {range.first === null ? "—" : range.first}
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Last matching index</div>
                <div className="mt-1 font-mono text-lg font-semibold">
                  {range.last === null ? "—" : range.last}
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Matching count</div>
                <div className="mt-1 font-mono text-lg font-semibold text-primary">
                  {range.count}
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Formula</div>
                <div className="mt-1 font-mono text-sm text-muted-foreground">
                  last − first + 1
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Contiguous interval</div>
              <div className="flex items-center gap-1">
                {sorted.map((t, i) => {
                  const inRange =
                    range.first !== null && range.last !== null && i >= range.first && i <= range.last;
                  const isFirst = range.first !== null && i === range.first;
                  const isLast = range.last !== null && i === range.last;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        inRange ? "bg-success/20" : "opacity-40",
                        isFirst && "border-l-4 border-l-success",
                        isLast && "border-r-4 border-r-success",
                      )}
                    >
                      <div className="flex size-8 items-center justify-center rounded-md border font-mono text-xs font-semibold border-transparent bg-card">
                        {t.word}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{i}</div>
                      {isFirst && <div className="text-[10px] text-success font-semibold">first</div>}
                      {isLast && <div className="text-[10px] text-success font-semibold">last</div>}
                    </div>
                  );
                })}
                {range.count === 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">No terms match this prefix.</span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {range.count === 0
                  ? "No terms begin with this prefix. The two boundary searches both landed outside any equal-0 block."
                  : `Indices ${range.first} through ${range.last} are contiguous because every term between them shares the prefix, and the dictionary is sorted alphabetically.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="size-5" />
              Naive vs sorted-range
            </CardTitle>
            <CardDescription>The same prefix query, two ways.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Naive linear scan</div>
                <div className="font-mono text-sm">for each term in dictionary:</div>
                <div className="font-mono text-sm ml-4">  if term starts with prefix: collect it</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Checks up to N terms. Then still needs a separate sort to rank by weight.
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3 border-success/50">
                <div className="text-xs font-semibold text-success mb-2">Sorted-range approach</div>
                <div className="font-mono text-sm">firstIndexOf(prefix) + lastIndexOf(prefix)</div>
                <div className="font-mono text-sm ml-4">slice(first … last) then sort by weight</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  O(log N) boundary searches, then work only on the M matches. Contiguity comes from
                  the one-time alphabetical sort.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
