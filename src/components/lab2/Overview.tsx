"use client";

import { ArrowRight, Clock, Database, Hash, Sparkles, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_TERMS } from "@/lib/lab2";

const steps = [
  { label: "Raw terms", icon: Database, desc: "Words with weights, in any order." },
  { label: "Sort alphabetically", icon: Hash, desc: "One-time O(N log N) sort makes prefixes contiguous." },
  { label: "Find the matching prefix range", icon: Sparkles, desc: "Two boundary searches, each O(log N)." },
  { label: "Extract matching terms", icon: ArrowRight, desc: "Copy only the contiguous M matches." },
  { label: "Sort matches by descending weight", icon: TrendingUp, desc: "O(M log M) on the subset, never the whole dictionary." },
  { label: "Display suggestions", icon: Users, desc: "Highest-weight matches shown first." },
];

const weightExamples = [
  { label: "Search frequency", desc: "Terms chosen more often rank higher." },
  { label: "City population", desc: "More populous cities rank higher." },
  { label: "Product popularity", desc: "Best-selling products rank higher." },
  { label: "Message frequency", desc: "Frequently messaged contacts rank higher." },
  { label: "Previous user selections", desc: "Previously picked suggestions rank higher." },
];

export function Overview() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              The problem
            </CardTitle>
            <CardDescription>
              Given a dictionary of strings and a nonnegative weight for each string, when a user types
              a prefix, return all terms beginning with that prefix, ordered from highest weight to
              lowest weight.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DEFAULT_TERMS.map((t) => (
                <div key={t.id} className="rounded-lg border bg-secondary/50 p-3 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">{t.word}</div>
                  <div className="mt-1 font-semibold">{t.weight}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              The pipeline
            </CardTitle>
            <CardDescription>
              Every autocomplete query runs the same six-step pipeline. The dictionary is sorted once;
              later queries only pay for the range search and the small match sort.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors",
                    i === steps.length - 1
                      ? "border-success text-success bg-success/10"
                      : "border-border text-muted-foreground bg-secondary",
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {s.icon && <s.icon className="size-4 opacity-60" />}
                    <span className="font-medium text-sm">{s.label}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-[1px] flex-1 flex items-center">
                    <div className="h-full border-l border-border opacity-40" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              What the weight represents
            </CardTitle>
            <CardDescription>The weight is a separate signal that decides ranking — not alphabetical order.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {weightExamples.map((e) => (
                <div key={e.label} className="rounded-lg border bg-secondary/50 p-3 text-sm">
                  <div className="font-semibold">{e.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{e.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow bg-accent/10 border-accent/20">
        <div className="flex flex-col items-center justify-center rounded-xl border bg-accent p-6 text-center">
          <div className="flex items-center gap-2 text-lg font-semibold text-accent-foreground">
            <Sparkles className="size-5" />
            Sort once, answer repeated queries efficiently.
          </div>
          <p className="mt-3 max-w-md text-sm text-accent-foreground/90">
            The alphabetical sort is the one-time cost. After that, every prefix query is answered by
            locating a contiguous range — never by re-scanning or re-sorting the whole dictionary.
          </p>
        </div>
      </div>
    </div>
  );
}
