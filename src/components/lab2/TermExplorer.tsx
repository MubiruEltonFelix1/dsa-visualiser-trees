"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, RefreshCcw, Database, LayoutList, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_TERMS,
  CITY_TERMS,
  WORD_FREQ_TERMS,
  emptyDataset,
  sortTerms,
  lexicographicTermCompare,
  reverseWeightTermCompare,
  validateTermInput,
  type Term,
} from "@/lib/lab2";

function nextId() {
  return Math.random().toString(36).slice(2, 9);
}

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

export function TermExplorer() {
  const [terms, setTerms] = useState<Term[]>(() => [...DEFAULT_TERMS]);
  const [draftWord, setDraftWord] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; word: string; weight: string } | null>(null);

  const sorted = useMemo(() => sortTerms([...terms], lexicographicTermCompare), [terms]);

  const validateAndSet = useCallback(
    (word: string, weightRaw: string, onSuccess: (t: Term) => void) => {
      const weight = Number(weightRaw);
      const check = validateTermInput(word, weight);
      if (!check.ok) {
        setError(check.message);
        return;
      }
      setError(null);
      onSuccess({ id: nextId(), word: word.trim(), weight });
    },
    [],
  );

  const addTerm = () => {
    validateAndSet(draftWord, draftWeight, (t) => {
      setTerms((ts) => [...ts, t]);
      setDraftWord("");
      setDraftWeight("");
    });
  };

  const deleteTerm = (id: string) => {
    setTerms((ts) => ts.filter((t) => t.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const startEdit = (t: Term) => {
    setEditing({ id: t.id, word: t.word, weight: String(t.weight) });
  };

  const saveEdit = () => {
    if (!editing) return;
    const weight = Number(editing.weight);
    const check = validateTermInput(editing.word, weight);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    setTerms((ts) =>
      ts.map((t) => (t.id === editing.id ? { ...t, word: editing.word.trim(), weight } : t)),
    );
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  const load = (dataset: Term[]) => {
    setTerms(dataset);
    setEditing(null);
    setError(null);
  };

  const reset = () => {
    setTerms([...DEFAULT_TERMS]);
    setEditing(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="size-5" />
              What a term is
            </CardTitle>
            <CardDescription>
              A term pairs a word with a nonnegative weight. The word drives alphabetical order; the
              weight drives ranking.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-xl border bg-secondary/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                <div className="text-lg font-mono font-semibold">{sorted[0]?.word ?? "camera"}</div>
                <span className="text-xs text-muted-foreground font-mono">→</span>
                <div className="text-lg font-mono font-semibold">{sorted[0]?.weight ?? 70}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div className="p-2 rounded-md border border-primary/20 text-primary">
                  <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
                    Word
                  </div>
                  <div className="text-sm">
                    Sets <strong>alphabetical</strong> position. Binary search compares words, not
                    weights.
                  </div>
                </div>
                <div className="p-2 rounded-md border border-accent/20 text-accent-foreground">
                  <div className="text-[10px] uppercase tracking-wider text-accent-foreground font-semibold mb-1">
                    Weight
                  </div>
                  <div className="text-sm">
                    Sets <strong>ranking</strong>. Higher weight = shown first. Never affects where
                    the word sits alphabetically.
                  </div>
                </div>
              </div>
            </div>
            <InsightCallout
              title="Why weight must be nonnegative"
              body={
                "Weights are compared to sort results from highest to lowest. A negative weight would " +
                "break that ordering and make \"highest weight first\" meaningless. That is why the lab " +
                "rejects negative weights with an educational error instead of silently accepting them."
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="size-5" />
              Term Explorer
            </CardTitle>
            <CardDescription>
              Build a dictionary term by term. Add, edit, delete, load example datasets, or reset.
              Invalid input shows an educational error message.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="explorer-word">Word</Label>
                <Input
                  id="explorer-word"
                  value={draftWord}
                  onChange={(e) => setDraftWord(e.target.value)}
                  placeholder="camera"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="explorer-weight">Weight</Label>
                <Input
                  id="explorer-weight"
                  type="number"
                  value={draftWeight}
                  onChange={(e) => setDraftWeight(e.target.value)}
                  placeholder="70"
                />
              </div>
              <div className="flex h-[calc(100%-4px)] items-end">
                <Button onClick={addTerm} disabled={editing !== null}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Dataset
            </CardTitle>
            <CardDescription>
              Each row is one term in the dictionary. Editing a weight changes ranking but not
              alphabetical position — try it and watch.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex gap-2">
                <Button onClick={() => load([...DEFAULT_TERMS])} size="sm">
                  Load example
                </Button>
                <Button onClick={() => load([...CITY_TERMS])} size="sm">
                  City-style
                </Button>
                <Button onClick={() => load([...WORD_FREQ_TERMS])} size="sm">
                  Word-frequency
                </Button>
                <Button onClick={() => load(emptyDataset())} size="sm" variant="outline">
                  Empty
                </Button>
                <Button onClick={reset} size="sm" variant="outline">
                  Reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {terms.length} term{terms.length !== 1 ? "s" : ""} in dictionary
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 text-muted-foreground font-medium">#</th>
                    <th className="pb-2 text-muted-foreground font-medium">Word</th>
                    <th className="pb-2 text-muted-foreground font-medium">Weight</th>
                    <th className="pb-2 text-muted-foreground font-medium">ID</th>
                    <th className="pb-2 text-muted-foreground font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t, i) => {
                    const isEditing = editing?.id === t.id;
                    return (
                      <tr key={t.id} className="border-b border-border/50">
                        <td className="py-3 font-mono">{i + 1}</td>
                        <td className="py-3">
                          {isEditing ? (
                            <Input
                              value={editing.word}
                              onChange={(e) => setEditing({ ...editing, word: e.target.value })}
                              className="w-full bg-transparent border-0 p-0"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{t.word}</span>
                          )}
                        </td>
                        <td className="py-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editing.weight}
                              onChange={(e) => setEditing({ ...editing, weight: e.target.value })}
                              className="w-full bg-transparent border-0 p-0"
                            />
                          ) : (
                            t.weight
                          )}
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                          {t.id}
                        </td>
                        <td className="py-3">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className="px-2"
                                title="Save"
                              >
                                <Plus className="size-3" />
                              </Button>
                              <Button size="sm" onClick={cancelEdit} className="px-2" variant="outline" title="Cancel">
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => startEdit(t)} className="px-2" title="Edit term">
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteTerm(t.id)}
                                variant="destructive"
                                className="px-2"
                                title="Delete term"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {terms.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        The dictionary is empty. Add a term or load a dataset.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="size-5" />
              Two roles, one term
            </CardTitle>
            <CardDescription>
              Changing a weight changes ranking but does not change alphabetical position. Watch the
              same term move between the two lists when you edit its weight above.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Alphabetical order (by word)</div>
                <div className="space-y-1 text-sm">
                  {sorted.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between">
                      <span className="font-medium">{t.word}</span>
                      <span className="text-muted-foreground font-mono">{t.weight}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Binary search operates on this list.
                </p>
              </div>
              <div className="rounded-lg border bg-secondary/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Recommendation order (by weight)</div>
                <div className="space-y-1 text-sm">
                  {[...sorted]
                    .sort((a, b) => reverseWeightTermCompare(a, b))
                    .slice(0, 5)
                    .map((t) => (
                      <div key={t.id} className="flex justify-between">
                        <span className="font-medium">{t.word}</span>
                        <span className="text-muted-foreground font-mono">{t.weight}</span>
                      </div>
                    ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Results are shown in this order.
                </p>
              </div>
            </div>
            <InsightCallout
              title="Why the two orders must stay separate"
              body={
                "The alphabetical list is the data structure binary search depends on. If weights " +
                "changed alphabetical positions, every weight edit would require re-sorting and break " +
                "the O(log N) search. Instead, weights are only ever used to rank the small match " +
                "subset at query time."
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
