"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, RefreshCcw, Database, LayoutList } from "lucide-react";
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
              Term Explorer
            </CardTitle>
            <CardDescription>
              Every term is a word plus a nonnegative weight. The word sets alphabetical order; the
              weight sets recommendation order.
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
              Each row shows the term as it exists in the dictionary. Weight edits change ranking,
              not alphabetical position.
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
              Changing a weight changes ranking but does not change alphabetical position.
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
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              The alphabetical list is the one the binary search operates on. The weight-sorted list
              is only ever built from the matching subset — never from the whole dictionary.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
