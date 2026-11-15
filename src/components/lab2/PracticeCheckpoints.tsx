"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, HelpCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "treeviz-lab2-practice";

interface Question {
  id: string;
  section: string;
  question: string;
  options: { label: string; value: string }[];
  correct: string;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: "alpha-order",
    section: "Term Explorer",
    question: "Which of these words comes first alphabetically (case-insensitive)?",
    options: [
      { label: "Banana", value: "Banana" },
      { label: "apple", value: "apple" },
      { label: "Carrot", value: "Carrot" },
    ],
    correct: "apple",
    explanation: "Alphabetical order is case-insensitive here: 'apple' < 'banana' < 'carrot' because 'a' comes before 'b' and 'c'.",
  },
  {
    id: "comparator-pick",
    section: "Comparator Playground",
    question: "You want to rank autocomplete results from highest weight to lowest. Which comparator should you use?",
    options: [
      { label: "Case-insensitive lexicographic", value: "lexicographic" },
      { label: "Reverse weight order", value: "reverse-weight" },
      { label: "Prefix order", value: "prefix" },
    ],
    correct: "reverse-weight",
    explanation: "Reverse weight order compares weights only, highest first. Words are ignored in this comparator.",
  },
  {
    id: "comparator-prefix",
    section: "Comparator Playground",
    question: "With k = 2 under prefix order, how do 'Kampala' and 'Kansas' compare?",
    options: [
      { label: "Kampala comes first", value: "first" },
      { label: "They compare equal", value: "equal" },
      { label: "Kansas comes first", value: "second" },
    ],
    correct: "equal",
    explanation: "Both begin with 'Ka', so under prefix order with k = 2 they compare equal. Equality is relative to the comparator.",
  },
  {
    id: "direction",
    section: "Binary Search Visualizer",
    question: "The middle term is 'mango' and the search key is 'banana'. Should the search continue left or right?",
    options: [
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
    correct: "left",
    explanation: "'mango' is above 'banana' alphabetically, so the key must be in the left half — discard the right.",
  },
  {
    id: "range",
    section: "Prefix Range Finder",
    question: "If firstIndex = 4 and lastIndex = 7, how many terms match the prefix?",
    options: [
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "7", value: "7" },
    ],
    correct: "4",
    explanation: "numberOfMatches = last − first + 1 = 7 − 4 + 1 = 4. No iteration over the matches is needed.",
  },
  {
    id: "ranking",
    section: "Autocomplete Simulator",
    question: "Matching terms: apple (100), apply (60), application (80). What is the correct result order?",
    options: [
      { label: "apple, application, apply", value: "apple" },
      { label: "apple, apply, application", value: "apply" },
      { label: "application, apply, apple", value: "application" },
    ],
    correct: "apple",
    explanation: "Results are sorted by descending weight: apple 100, application 80, apply 60.",
  },
  {
    id: "complexity",
    section: "Complexity Lab",
    question: "What is the complexity of numberOfMatches?",
    options: [
      { label: "O(M)", value: "O(M)" },
      { label: "O(log N)", value: "O(log N)" },
      { label: "O(N)", value: "O(N)" },
    ],
    correct: "O(log N)",
    explanation: "numberOfMatches is pure arithmetic on the two boundaries (last − first + 1) after the two O(log N) searches. It never iterates the M matches.",
  },
  {
    id: "bug-early-stop",
    section: "Binary Search Visualizer",
    question: "An implementation returns immediately after the first binary-search match finds 'banana'. Why is that wrong for prefix ranges?",
    options: [
      { label: "It may miss earlier or later matching terms", value: "miss" },
      { label: "It sorts by weight instead", value: "sort" },
      { label: "It uses too much memory", value: "memory" },
    ],
    correct: "miss",
    explanation: "Several terms can match the same prefix. Stopping at the first match misses the rest of the contiguous range — you need firstIndexOf and lastIndexOf.",
  },
  {
    id: "bug-sort-by-weight",
    section: "Autocomplete Simulator",
    question: "An implementation sorts the whole dictionary by weight before answering queries. Why is that wrong?",
    options: [
      { label: "It destroys alphabetical order, breaking binary search", value: "breaks" },
      { label: "It is too slow to add terms", value: "slow" },
      { label: "It loses the weights", value: "weights" },
    ],
    correct: "breaks",
    explanation: "Binary search requires the array to stay alphabetically sorted. Sorting by weight destroys that structure, so the boundary searches no longer work.",
  },
];

const FINAL_CHECK: Question[] = [
  {
    id: "final-why-sorted",
    section: "Final check",
    question: "Why must the dictionary be sorted alphabetically?",
    options: [
      { label: "So prefix matches are contiguous and binary search can discard halves", value: "contiguous" },
      { label: "So weights can be summed", value: "sum" },
      { label: "So the UI looks nicer", value: "ui" },
    ],
    correct: "contiguous",
    explanation: "Alphabetical order puts all terms sharing a prefix next to each other, and lets binary search discard half the remaining interval at each step.",
  },
  {
    id: "final-why-two-searches",
    section: "Final check",
    question: "Why are two binary searches needed?",
    options: [
      { label: "One finds the first match, the other finds the last match — together they give the full range", value: "range" },
      { label: "One searches by word, the other by weight", value: "word-weight" },
      { label: "One is a backup in case the first fails", value: "backup" },
    ],
    correct: "range",
    explanation: "firstIndexOf finds the leftmost match and lastIndexOf finds the rightmost match; the interval between them is every matching term.",
  },
  {
    id: "final-prefix-equal",
    section: "Final check",
    question: "Why can multiple terms compare equal under prefix order?",
    options: [
      { label: "Because only the first k characters are compared, so words sharing them tie", value: "k-chars" },
      { label: "Because weights are ignored", value: "weights" },
      { label: "Because the dictionary is unsorted", value: "unsorted" },
    ],
    correct: "k-chars",
    explanation: "Prefix order compares only the first k characters case-insensitively, so 'Kampala' and 'Kansas' tie at k = 2 ('Ka').",
  },
  {
    id: "final-number-of-matches",
    section: "Final check",
    question: "Why does numberOfMatches not depend on M?",
    options: [
      { label: "It is arithmetic on the two boundary indices, not an iteration", value: "arithmetic" },
      { label: "It always returns 1", value: "one" },
      { label: "It counts every term in the dictionary", value: "all" },
    ],
    correct: "arithmetic",
    explanation: "numberOfMatches = last − first + 1. It never walks through the M matches, so it stays O(log N).",
  },
  {
    id: "final-all-matches-m",
    section: "Final check",
    question: "Why does allMatches depend on M?",
    options: [
      { label: "It must copy and sort the M matching terms", value: "copy-sort" },
      { label: "It scans all N terms twice", value: "scan" },
      { label: "It deletes non-matching terms", value: "delete" },
    ],
    correct: "copy-sort",
    explanation: "allMatches copies the M matches (O(log N) to find them) and sorts them by weight (O(M log M)).",
  },
  {
    id: "final-alphabetical-preserved",
    section: "Final check",
    question: "Why should the main dictionary remain alphabetical after a query?",
    options: [
      { label: "So the next query's boundary searches still work", value: "next-query" },
      { label: "So weights stay sorted", value: "weights" },
      { label: "So terms can be deleted faster", value: "delete" },
    ],
    correct: "next-query",
    explanation: "Binary search relies on alphabetical order. A query only reads and sorts the match subset — the dictionary itself is never reordered by weight.",
  },
  {
    id: "final-weight-updates",
    section: "Final check",
    question: "What would change if weights were updated constantly?",
    options: [
      { label: "The ranking would need recomputing per query; alphabetical order still holds for prefix search", value: "recompute" },
      { label: "Nothing — weights don't matter", value: "nothing" },
      { label: "The dictionary would need re-sorting by weight", value: "weight-sort" },
    ],
    correct: "recompute",
    explanation: "The alphabetical dictionary still supports prefix range lookup in O(log N); only the final match sort reflects the latest weights.",
  },
  {
    id: "final-trie",
    section: "Final check",
    question: "When might a trie be better than a sorted array?",
    options: [
      { label: "When doing many character-by-character prefix or fuzzy lookups on a huge, changing dictionary", value: "trie" },
      { label: "Never — sorted arrays are always better", value: "never" },
      { label: "When there are no weights", value: "no-weights" },
    ],
    correct: "trie",
    explanation: "A trie excels at prefix and fuzzy navigation over large dynamic dictionaries; the sorted array is simpler and excellent when the dictionary changes infrequently.",
  },
];

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable — progress is ephemeral
  }
}

export function PracticeCheckpoints() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const answered = useMemo(() => {
    const bySection: Record<string, { total: number; done: number }> = {};
    for (const q of QUESTIONS) {
      const s = bySection[q.section] ?? { total: 0, done: 0 };
      s.total++;
      if (progress[q.id]) s.done++;
      bySection[q.section] = s;
    }
    return bySection;
  }, [progress]);

  const finalDone = useMemo(() => FINAL_CHECK.filter((q) => progress[q.id]).length, [progress]);

  const handleAnswer = useCallback(
    (q: Question, value: string) => {
      const ok = value === q.correct;
      setFeedback({ ok, message: ok ? "Correct." : q.explanation });
      if (ok) {
        setProgress((p) => ({ ...p, [q.id]: true }));
        saveProgress({ ...progress, [q.id]: true });
      }
    },
    [progress],
  );

  const retry = () => setFeedback(null);

  const allDone = Object.keys(answered).length > 0 && Object.values(answered).every((s) => s.done === s.total);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-panel p-5 shadow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5" />
              Practice & Checkpoints
            </CardTitle>
            <CardDescription>
              Short exercises after each section with immediate feedback. Progress is saved locally —
              no accounts, no backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {Object.entries(answered).map(([section, s]) => (
                <div key={section} className="rounded-lg border bg-secondary/50 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">{section}</div>
                  <div className="mt-1 font-mono text-lg font-semibold">
                    {s.done} / {s.total}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.done === s.total ? "Complete" : "In progress"}
                  </div>
                </div>
              ))}
              <div className="rounded-lg border bg-secondary/50 p-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">Final check</div>
                  <div className="mt-1 font-mono text-lg font-semibold">
                    {finalDone} / {FINAL_CHECK.length}
                  </div>
                </div>
                {finalDone === FINAL_CHECK.length && (
                  <span className="mt-1 text-xs text-success font-semibold">Complete</span>
                )}
              </div>
            </div>
            {allDone && finalDone === FINAL_CHECK.length && (
              <div className="mt-3 rounded-lg border border-success bg-success/10 p-3 text-sm">
                <CheckCircle2 className="size-4 text-success mr-2" />
                All exercises and the final check are complete.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {active ? (
        <QuestionCard
          question={([...QUESTIONS, ...FINAL_CHECK].find((q) => q.id === active))!}
          onAnswer={handleAnswer}
          onRetry={retry}
          feedback={feedback}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...QUESTIONS, ...FINAL_CHECK].map((q) => {
            const done = !!progress[q.id];
            return (
              <Card
                key={q.id}
                className={cn(
                  "cursor-pointer hover:bg-accent/30 transition-colors",
                  done && "border-success bg-success/5",
                )}
                onClick={() => setActive(q.id)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-sm leading-snug">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{q.section}</span>
                    {done ? (
                      <CheckCircle2 className="size-3.5 text-success" />
                    ) : (
                      <HelpCircle className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (q: Question, value: string) => void;
  onRetry: () => void;
  feedback: { ok: boolean; message: string } | null;
}

function QuestionCard({ question, onAnswer, onRetry, feedback }: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onAnswer(question, value);
  };

  return (
    <Card className="max-w-xl">
      <CardHeader className="p-5">
        <CardTitle className="text-lg">{question.question}</CardTitle>
        <span className="text-xs text-muted-foreground">{question.section}</span>
      </CardHeader>
      <CardContent className="p-5 space-y-3">
        {question.options.map((o) => {
          const isCorrect = o.value === question.correct;
          const chosen = selected === o.value;
          const showResult = feedback !== null && chosen;
          return (
            <Button
              key={o.value}
              onClick={() => handleSelect(o.value)}
              disabled={feedback !== null}
              variant={showResult && isCorrect ? "default" : showResult ? "destructive" : "outline"}
              className="w-full text-left text-sm"
            >
              {o.label}
              {showResult && isCorrect && <CheckCircle2 className="ml-2 size-4" />}
              {showResult && chosen && !isCorrect && <XCircle className="ml-2 size-4" />}
            </Button>
          );
        })}
        {feedback && (
          <div className={cn("rounded-md p-3 text-sm", feedback.ok ? "border-success bg-success/10 text-success" : "border-destructive bg-destructive/10 text-destructive")}>
            {feedback.ok ? <CheckCircle2 className="mr-2 size-4" /> : <XCircle className="mr-2 size-4" />}
            {feedback.message}
          </div>
        )}
        {!feedback && (
          <p className="text-xs text-muted-foreground">Select an answer to see immediate feedback.</p>
        )}
        {feedback && !feedback.ok && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
