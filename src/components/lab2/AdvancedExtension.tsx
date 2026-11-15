"use client";

import { useMemo, useState } from "react";
import { FlaskRound, ShieldAlert, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDeletedDictionary, deletedForms, fuzzyCandidates, type Term } from "@/lib/lab2";

export function AdvancedExtension({ terms }: { terms: Term[] }) {
  const [prefix, setPrefix] = useState("");
  const [deletionCost, setDeletionCost] = useState(0.25);

  const deleted = useMemo(() => buildDeletedDictionary(terms, deletionCost), [terms, deletionCost]);
  const result = useMemo(() => fuzzyCandidates(terms, deleted, prefix), [terms, deleted, prefix]);

  const cameraForms = deletedForms("camera");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow border-destructive/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskRound className="size-5 text-destructive" />
            <span className="font-semibold text-destructive">Advanced extension — optional</span>
          </div>
          <BadgeVariant>Not part of the required Lab 2 path</BadgeVariant>
        </div>
        <Card className="mt-4 border-destructive/20">
          <CardHeader>
            <CardTitle>1-deleted dictionary fuzzy autocomplete</CardTitle>
            <CardDescription>
              For every dictionary word, generate the terms formed by deleting one character, search
              both the original and the deleted dictionary, and also try deleting one character from
              the typed prefix.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fuzzy-prefix">Try a prefix</Label>
                <Input
                  id="fuzzy-prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. camea"
                />
              </div>
              <div className="space-y-2 flex h-9 items-center">
                <Label className="shrink-0" htmlFor="fuzzy-cost">
                  Deletion cost
                </Label>
                <Input
                  id="fuzzy-cost"
                  type="number"
                  value={deletionCost.toFixed(2)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v) && v >= 0 && v <= 1) setDeletionCost(v);
                  }}
                  className="w-20"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-secondary/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Original term — camera</div>
              <div className="flex flex-wrap gap-2">
                {cameraForms.map((f) => (
                  <span key={f} className="rounded-md border border-input bg-card px-2 py-1 text-xs font-mono">
                    "{f}"
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Six one-deleted forms. A 2-deleted dictionary would grow combinatorially —{" "}
                <span className="font-semibold">too large to be practical</span> — which is why this is
                an optional extension, not the main design.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Original dictionary matches</div>
                <div className="mt-1 font-mono text-sm">
                  {result.original.length ? result.original.map((t) => `"${t.word}"`).join(", ") : "—"}
                </div>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground">Deleted-form matches</div>
                <div className="mt-1 font-mono text-sm">
                  {result.deleted.length ? result.deleted.map((d) => `"${d.form}" (from "${d.source}")`).join(", ") : "—"}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-destructive" />
                <span className="font-semibold text-sm text-destructive">
                  This is an advanced, optional extension.
                </span>
              </div>
              <p className="mt-2 text-sm text-destructive/70">
                It trades memory for typo tolerance. The required Lab 2 design is exact prefix
                matching on a sorted array — fuzzy matching is not part of the core path.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BadgeVariant({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-destructive/50 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
      {children}
    </span>
  );
}
