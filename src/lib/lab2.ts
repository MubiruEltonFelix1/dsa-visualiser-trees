/*
 * TreeViz — Lab 2: Autocomplete
 *
 * Core teaching logic for the autocomplete lab. These are pure functions that
 * return plain data; the UI drives them and steps through the results. The
 * implementation demonstrates the algorithm and its reasoning but is not the
 * assessed Java lab solution — students should still write their own.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type Cmp = -1 | 0 | 1;

export interface Term {
  id: string;
  word: string;
  weight: number;
}

export interface TermInput {
  word: string;
  weight: number;
}

export type ComparatorKind = "lexicographic" | "reverse-weight" | "prefix";

export interface SearchFrame {
  step: number;
  low: number;
  mid: number | null;
  high: number;
  key: string;
  cmp: Cmp | null;
  eliminated: "left" | "right" | "none";
  answer: number | null;
  found: boolean;
  done: boolean;
}

export interface PrefixRange {
  first: number | null;
  last: number | null;
  count: number;
}

export interface SearchTrace {
  frames: SearchFrame[];
  result: number | null;
}

/* ------------------------------------------------------------------ */
/*  Comparators                                                       */
/* ------------------------------------------------------------------ */

/** Case-insensitive lexicographic comparison of two strings. */
export function compareStrings(a: string, b: string): Cmp {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

/** Compare whole words only — case-insensitive lexicographic order. Weights are ignored. */
export function lexicographicTermCompare(a: Term, b: Term): Cmp {
  return compareStrings(a.word, b.word);
}

/** Compare from highest weight to lowest weight. Words are ignored. */
export function reverseWeightTermCompare(a: Term, b: Term): Cmp {
  if (a.weight === b.weight) return 0;
  return a.weight > b.weight ? -1 : 1;
}

/** Compare only the first `k` characters of each word, case-insensitively.
 *  Two different words can compare equal when they share the same first k chars. */
export function makePrefixTermCompare(k: number) {
  return (a: Term, b: Term): Cmp => {
    const pa = a.word.slice(0, k).toLowerCase();
    const pb = b.word.slice(0, k).toLowerCase();
    return compareStrings(pa, pb);
  };
}

/** Compare a term against a string key for binary search.
 *  In "word" mode the full word is compared; in "prefix" mode only the first
 *  key.length characters are compared, so every term starting with the key
 *  compares equal to 0. */
export function makeTermToKeyComparator(mode: "word" | "prefix", key: string) {
  const k = key.toLowerCase();
  return (term: Term): Cmp => {
    const slice = mode === "prefix" ? term.word.slice(0, key.length) : term.word;
    return compareStrings(slice, k);
  };
}

/* ------------------------------------------------------------------ */
/*  Sorting                                                           */
/* ------------------------------------------------------------------ */

export function sortTerms(terms: Term[], comparator: (a: Term, b: Term) => Cmp): Term[] {
  return [...terms].sort((a, b) => comparator(a, b));
}

/** Sort the dictionary alphabetically — the one-time O(N log N) cost. */
export function sortDictionaryAlphabetically(terms: Term[]): Term[] {
  return sortTerms(terms, lexicographicTermCompare);
}

/* ------------------------------------------------------------------ */
/*  Binary search                                                     */
/* ------------------------------------------------------------------ */

function pushFrame(
  frames: SearchFrame[],
  step: number,
  low: number,
  mid: number | null,
  high: number,
  key: string,
  cmp: Cmp | null,
  eliminated: "left" | "right" | "none",
  answer: number | null,
  found: boolean,
  done: boolean,
) {
  frames.push({ step, low, mid, high, key, cmp, eliminated, answer, found, done });
}

/**
 * Trace an ordinary or boundary binary search, producing one frame per loop
 * iteration so the UI can replay real algorithm state.
 *
 * mode "ordinary": stop at the first match found.
 * mode "first":    when a match is found, save it and keep searching left.
 * mode "last":     when a match is found, save it and keep searching right.
 */
export function traceBinarySearch(
  terms: Term[],
  key: string,
  mode: "ordinary" | "first" | "last",
  cmpTermToKey: (term: Term) => Cmp,
): SearchTrace {
  const frames: SearchFrame[] = [];
  let low = 0;
  let high = terms.length - 1;
  let answer: number | null = null;
  let step = 0;
  let done = false;
  let found = false;

  pushFrame(frames, step, low, null, high, key, null, "none", answer, found, done);
  step++;

  while (low <= high && !done) {
    const mid = Math.floor((low + high) / 2);
    const cmp = cmpTermToKey(terms[mid]!);
    let eliminated: "left" | "right" | "none" = "none";

    if (cmp === 0) {
      answer = mid;
      if (mode === "ordinary") {
        found = true;
        done = true;
      } else if (mode === "first") {
        // Keep the match as the current answer, but continue searching left.
        eliminated = "right";
        high = mid - 1;
      } else {
        // mode "last": keep the match, continue searching right.
        eliminated = "left";
        low = mid + 1;
      }
    } else if (cmp < 0) {
      // mid is below the key: everything at low..mid is below too.
      eliminated = "left";
      low = mid + 1;
    } else {
      // mid is above the key: everything at mid..high is above too.
      eliminated = "right";
      high = mid - 1;
    }

    done = done || low > high || found;
    pushFrame(frames, step, low, mid, high, key, cmp, eliminated, answer, found, done);
    step++;
  }

  return { frames, result: answer };
}

/** Ordinary binary search for one matching term. */
export function ordinaryBinarySearch(
  terms: Term[],
  key: string,
  cmpTermToKey: (term: Term) => Cmp,
): SearchTrace {
  return traceBinarySearch(terms, key, "ordinary", cmpTermToKey);
}

/** firstIndexOf: leftmost matching index, or null. */
export function firstIndexOf(
  terms: Term[],
  key: string,
  cmpTermToKey: (term: Term) => Cmp,
): SearchTrace {
  return traceBinarySearch(terms, key, "first", cmpTermToKey);
}

/** lastIndexOf: rightmost matching index, or null. */
export function lastIndexOf(
  terms: Term[],
  key: string,
  cmpTermToKey: (term: Term) => Cmp,
): SearchTrace {
  return traceBinarySearch(terms, key, "last", cmpTermToKey);
}

/* ------------------------------------------------------------------ */
/*  Prefix range                                                      */
/* ------------------------------------------------------------------ */

export function findPrefixRange(terms: Term[], prefix: string): PrefixRange {
  if (terms.length === 0) return { first: null, last: null, count: 0 };
  const cmp = makeTermToKeyComparator("prefix", prefix);
  const firstTrace = firstIndexOf(terms, prefix, cmp);
  const first = firstTrace.result;
  if (first === null) return { first: null, last: null, count: 0 };
  const lastTrace = lastIndexOf(terms, prefix, cmp);
  const last = lastTrace.result;
  const count = last !== null ? last - first + 1 : 0;
  return { first, last: last ?? null, count };
}

/** numberOfMatches is O(log N): two boundary searches plus arithmetic, never an M-iteration. */
export function numberOfMatches(terms: Term[], prefix: string): number {
  return findPrefixRange(terms, prefix).count;
}

/** All matching terms, sorted by descending weight. O(log N + M log M). */
export function allMatches(terms: Term[], prefix: string): Term[] {
  const range = findPrefixRange(terms, prefix);
  if (range.first === null) return [];
  const slice = terms.slice(range.first, (range.last ?? range.first) + 1);
  return sortTerms(slice, reverseWeightTermCompare);
}

/* ------------------------------------------------------------------ */
/*  Datasets                                                          */
/* ------------------------------------------------------------------ */

function term(word: string, weight: number): Term {
  return { id: `${word}-${weight}-${Math.random().toString(36).slice(2, 8)}`, word, weight };
}

/** Small worked example used in the overview and demos. */
export const DEFAULT_TERMS: Term[] = [
  term("apple", 100),
  term("application", 80),
  term("apply", 60),
  term("banana", 200),
  term("band", 90),
];

/** City-style dataset — weight represents population. */
export const CITY_TERMS: Term[] = [
  term("Nairobi", 4_500_000),
  term("Kampala", 3_800_000),
  term("Mombasa", 1_200_000),
  term("Kigali", 1_100_000),
  term("Kisumu", 600_000),
  term("Eldoret", 500_000),
  term("Nakuru", 570_000),
  term("Kansas City", 500_000),
];

/** Word-frequency style dataset — weight represents search frequency. */
export const WORD_FREQ_TERMS: Term[] = [
  term("the", 5000),
  term("of", 3000),
  term("and", 2500),
  term("to", 2200),
  term("a", 1800),
  term("in", 1700),
  term("is", 1400),
  term("it", 1300),
];

export function emptyDataset(): Term[] {
  return [];
}

/** Validate a term input and return an educational error message when invalid. */
export function validateTermInput(word: string, weight: number): { ok: true } | { ok: false; message: string } {
  if (word === null || word === undefined) {
    return { ok: false, message: "A term must have a word — it cannot be null or empty." };
  }
  const trimmed = word.trim();
  if (trimmed === "") {
    return { ok: false, message: "A term's word cannot be an empty string." };
  }
  if (!Number.isFinite(weight)) {
    return { ok: false, message: "Weight must be a finite number." };
  }
  if (weight < 0) {
    return { ok: false, message: "Weight must be nonnegative — negative weights break descending-weight ranking." };
  }
  if (weight > Number.MAX_SAFE_INTEGER) {
    return { ok: false, message: "Weight is too large to compare safely." };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Fuzzy extension (optional, clearly advanced)                      */
/* ------------------------------------------------------------------ */

/** Every distinct string formed by deleting exactly one character. */
export function deletedForms(word: string): string[] {
  const forms = new Set<string>();
  for (let i = 0; i < word.length; i++) {
    forms.add(word.slice(0, i) + word.slice(i + 1));
  }
  return Array.from(forms).sort(compareStrings);
}

/** Build a 1-deleted dictionary: for each word, its one-deleted forms carry the
 *  original weight reduced by a fixed deletion cost. */
export interface DeletedEntry {
  form: string;
  source: string;
  weight: number;
}

export function buildDeletedDictionary(terms: Term[], deletionCost = 0.25): DeletedEntry[] {
  const entries: DeletedEntry[] = [];
  for (const term of terms) {
    for (const form of deletedForms(term.word)) {
      entries.push({ form, source: term.word, weight: term.weight * (1 - deletionCost) });
    }
  }
  return entries;
}

/** Fuzzy candidate search over original + deleted dictionaries. Optional extension. */
export function fuzzyCandidates(
  terms: Term[],
  deleted: DeletedEntry[],
  prefix: string,
): { original: Term[]; deleted: DeletedEntry[] } {
  const original = allMatches(terms, prefix);
  const deletedMatches = deleted.filter((d) => d.form.toLowerCase().startsWith(prefix.toLowerCase()));
  return { original, deleted: deletedMatches };
}
