"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, LayoutList, ListOrdered, Play, Pause, SkipBack, SkipForward, RotateCcw, TrendingUp, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStepper } from "@/hooks/use-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_TERMS,
  allMatches,
  findPrefixRange,
  reverseWeightTermCompare,
  sortDictionaryAlphabetically,
  sortTerms,
  type Term,
} from "@/lib/lab2";

const PLAYBACK_STEPS = [
  { label: "Read the prefix", desc: "The learner types a prefix — e.g. \"app\"." },
  { label: "Build the search key", desc: "The prefix becomes the key used for both boundary searches." },
  { label: "Run first boundary search", desc: "firstIndexOf finds the leftmost term that starts with the prefix." },
  { label: "Run last boundary search", desc: "lastIndexOf finds the rightmost term that starts with the prefix." },
  { label: "Compute the range", desc: "The matching terms are indices first … last — a contiguous slice." },
  { label: "Copy only matching terms", desc: "Copy the slice into a result array. Non-matches are never touched." },
  { label: "Sort matches by reverse weight", desc: "Sort the M matches from highest weight to lowest." },
  { label: "Display final suggestions", desc: "Show the ranked list to the user." },
];

export function AutocompleteSimulator() {
  const [prefix, setPrefix] = useState("app");
  const [mode, setMode] = useState<"live" | "playback">("live");
  const [playbackStep, setPlaybackStep] = useState(0);

  const dictionary = useMemo(() => sortDictionaryAlphabetically([...DEFAULT_TERMS]), []);
  const range = useMemo(() => findPrefixRange(dictionary, prefix), [dictionary, prefix]);
  const matches = useMemo(() => (range.first === null ? [] : allMatches(dictionary, prefix)), [dictionary, prefix]);

  const playback = useStepper(PLAYBACK_STEPS.length, {
    delay: 900,
    resetKey: mode,
  });

  const activeStep = playback.step >= 0 ? playback.step : 0;
  const playbackStepInfo =
    PLAYBACK_STEPS[Math.min(activeStep, PLAYBACK_STEPS.length - 1)]!;

  const handlePrefixChange = useCallback((v: string) => {
    setPrefix(v);
    setMode("live");
    setPlaybackStep(0);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-5" />
              Autocomplete Simulator
            </CardTitle>
            <CardDescription>
              Type a prefix. The dictionary stays alphabetical; the results are sorted by descending
              weight. Use playback to see the query one step at a time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">Prefix</label>
                <Input
                  value={prefix}
                  onChange={(e) => handlePrefixChange(e.target.value)}
                  placeholder="e.g. app"
                  className="w-full"
                />
              </div>
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">Mode</label>
                <div className="flex gap-1">
                  <Button
                    onClick={() => setMode("live")}
                    variant={mode === "live" ? "default" : "outline"}
                    size="sm"
                  >
                    Live
                  </Button>
                  <Button
                    onClick={() => setMode("playback")}
                    variant={mode === "playback" ? "default" : "outline"}
                    size="sm"
                  >
                    Playback
                  </Button>
                </div>
              </div>
              <div className="space-y-2 flex h-full items-end">
                <label className="text-xs font-semibold text-muted-foreground">{matches.length} match{matches.length !== 1 ? "es" : ""}</label>
                <div className="font-mono font-semibold text-primary">{range.count}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Sorted dictionary (alphabetical)</div>
                  <div className="grid gap-1">
                    {dictionary.map((t, i) => {
                      const inRange =
                        range.first !== null && range.last !== null && i >= range.first && i <= range.last;
                      const weightRank = matches.findIndex((m) => m.id === t.id) + 1;
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-center justify-between rounded-md border px-2 py-1.5 text-xs transition-colors",
                            inRange
                              ? "border-success bg-success/10"
                              : "border-border bg-secondary/50",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{i}</span>
                            <span className="font-medium">{t.word}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({t.weight})</span>
                          </div>
                          {inRange ? (
                            <span className="text-[10px] font-semibold text-success">
                              rank #{weightRank}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                    {dictionary.length === 0 && <div className="text-xs text-muted-foreground text-center py-2">Empty dictionary.</div>}
                  </div>
                </div>
                <div className="w-72 flex-shrink-0 rounded-lg border bg-panel p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ListOrdered className="size-4" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Results (by descending weight)</span>
                  </div>
                  <div className="space-y-1">
                    {matches.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-3">No matches.</div>
                    ) : (
                      matches.map((t, i) => (
                        <div key={t.id} className="flex items-center justify-between rounded-md border bg-card px-2 py-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-[10px] font-mono text-muted-foreground">{i + 1}</span>
                            <span className="font-medium">{t.word}</span>
                          </div>
                          <span className="font-mono text-[10px] font-semibold">{t.weight}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {mode === "playback" && (
              <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="size-4" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Playback — step {Math.min(activeStep + 1, PLAYBACK_STEPS.length)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button onClick={playback.prev} size="sm" disabled={playback.atStart} className="px-3">
                    <SkipBack className="size-3" />
                  </Button>
                  <Button
                    onClick={() => (playback.playing ? playback.pause() : playback.play())}
                    size="sm"
                    disabled={playback.done}
                    className="px-3"
                  >
                    {playback.playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                  </Button>
                  <Button onClick={playback.next} size="sm" disabled={playback.done} className="px-3">
                    <SkipForward className="size-3" />
                  </Button>
                  <Button onClick={playback.reset} size="sm" variant="outline" className="px-3">
                    <RotateCcw className="size-3" />
                  </Button>
                </div>
                <div className="mt-2 rounded-md border border-accent/50 bg-accent/10 p-2">
                  <div className="text-xs font-semibold text-accent-foreground mb-1">{playbackStepInfo.label}</div>
                  <div className="text-sm text-accent-foreground/90">{playbackStepInfo.desc}</div>
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
              <BarChart2 className="size-5" />
              Compare approaches
            </CardTitle>
            <CardDescription>Same query, two strategies. Only the sorted-range approach keeps the dictionary alphabetical.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-destructive mb-2">Naive approach</div>
                <div className="font-mono text-sm mb-2">for each term in dictionary:</div>
                <div className="font-mono text-sm ml-4">  if starts with prefix: add to results</div>
                <div className="font-mono text-sm ml-4">sort all results by weight</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Scans up to N terms, then re-sorts everything it found. The dictionary order is not
                  reused and the result order mixes alphabetical and weight concerns.
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3 border-success/50">
                <div className="text-xs font-semibold text-success mb-2">Lab approach</div>
                <div className="font-mono text-sm mb-2">firstIndexOf + lastIndexOf → range</div>
                <div className="font-mono text-sm ml-4">slice only the M matches</div>
                <div className="font-mono text-sm ml-4">sort only those M by descending weight</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  The main dictionary stays alphabetical — that structure is what makes the boundary
                  searches valid. Sorting the whole dictionary by weight would destroy it.
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-secondary/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Why sort only the matches?</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>The binary search needs an alphabetically sorted array — that order must be preserved.</li>
                <li>Ranking by weight applies only to the subset the user will actually see.</li>
                <li>Sorting M matches costs O(M log M); re-sorting the whole dictionary costs O(N log N) on every query.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
