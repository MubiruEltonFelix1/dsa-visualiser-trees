// Min and max heap model — genuine binary heaps backed by an array
// (a level-order complete binary tree). Min and max share one
// implementation, parameterised by a comparator.
import type { RNode } from "./traversal";
import type { Op } from "./linear";
import { opFrame, type OpFrame } from "./linear";

export type HeapKind = "min" | "max";

export type HeapOp = Op<number>;

const parent = (i: number) => (i - 1) >> 1;
const left = (i: number) => 2 * i + 1;
const right = (i: number) => 2 * i + 2;

function heapWords(kind: HeapKind) {
  return kind === "min"
    ? {
        cmp: (a: number, b: number) => a < b,
        rel: "is smaller than",
        which: "smaller",
        extreme: "minimum",
        Extreme: "Minimum",
        op: "extractMin",
        peek: "peekMin",
        label: "Min heap",
      }
    : {
        cmp: (a: number, b: number) => a > b,
        rel: "is larger than",
        which: "larger",
        extreme: "maximum",
        Extreme: "Maximum",
        op: "extractMax",
        peek: "peekMax",
        label: "Max heap",
      };
}

export function heapCode(kind: HeapKind): string[] {
  const { cmp, which, Extreme, op, peek, extreme } = heapWords(kind);
  const symbol = kind === "min" ? "<" : ">";
  const ret = kind === "min" ? "min" : "max";
  return [
    `function insert(heap, value):`,
    `    heap.append(value)          // end of array — keeps the tree complete`,
    `    i := heap.length - 1`,
    `    while i > 0 and heap[i] ${symbol} heap[parent(i)]:   // heapify-up`,
    `        swap(heap[i], heap[parent(i)])`,
    `        i := parent(i)`,
    "",
    `function ${op}(heap):`,
    `    if heap is empty: error`,
    `    ${Extreme} := heap[0]   // the root`,
    `    heap[0] := heap.last   // move last element to the root`,
    `    heap.removeLast()`,
    `    heapifyDown(heap, 0)   // restore the heap property`,
    `    return ${ret}`,
    "",
    `function heapifyDown(heap, i):`,
    `    ${Extreme === "Maximum" ? "largest" : "smallest"} := i`,
    `    if left exists and heap[left] ${symbol} heap[${Extreme === "Maximum" ? "largest" : "smallest"}]: ${Extreme === "Maximum" ? "largest" : "smallest"} := left`,
    `    if right exists and heap[right] ${symbol} heap[${Extreme === "Maximum" ? "largest" : "smallest"}]: ${Extreme === "Maximum" ? "largest" : "smallest"} := right`,
    `    if ${Extreme === "Maximum" ? "largest" : "smallest"} ≠ i:`,
    `        swap(heap[i], heap[${Extreme === "Maximum" ? "largest" : "smallest"}])`,
    `        heapifyDown(heap, ${Extreme === "Maximum" ? "largest" : "smallest"})`,
    "",
    `function ${peek}(heap):`,
    `    return heap[0]`,
    "",
    `function delete(heap, i):`,
    `    swap(heap[i], heap.last)`,
    `    heap.removeLast()`,
    `    sift up or down from i as needed`,
    "",
    `function clear(heap):`,
    `    heap := []`,
  ];
}

export function heapExplain(kind: HeapKind): string[] {
  const { extreme, Extreme, which, label } = heapWords(kind);
  return [
    `A ${label} is a complete binary tree where every parent ${which === "smaller" ? "is less than or equal to" : "is greater than or equal to"} its children.`,
    `The root always holds the ${extreme}, so peek is O(1).`,
    "Insert appends at the end of the array and swaps upward (heapify-up) until the heap property holds again — O(log n).",
    `Extract replaces the root with the last element and swaps downward (heapify-down) — O(log n).`,
    "The array is a level-order layout of the tree: children of index i sit at 2i+1 and 2i+2.",
  ];
}

export function heapStats(heap: number[]): [string, string | number][] {
  const n = heap.length;
  return [
    ["Size", n],
    ["Root element", n ? heap[0]! : "—"],
    ["Height (edges)", n ? Math.floor(Math.log2(n)) : "—"],
    ["Insert", "O(log n)"],
    ["Extract", "O(log n)"],
    ["Peek", "O(1)"],
  ];
}

export function heapInsert(heap: number[], value: number, kind: HeapKind): HeapOp {
  const { cmp, rel, which, extreme, Extreme } = heapWords(kind);
  const before = [...heap];
  const after = [...before, value];
  const frames: OpFrame<number>[] = [
    opFrame(
      after,
      `Insert ${value}`,
      `Append ${value} at the end of the array — the complete-tree shape is preserved.`,
      3,
      after.length - 1,
      [after.length - 1],
    ),
  ];
  const h = after;
  let i = h.length - 1;
  while (i > 0) {
    const p = parent(i);
    if (!cmp(h[i]!, h[p]!)) break;
    const childVal = h[i]!;
    const parentVal = h[p]!;
    h[i] = parentVal;
    h[p] = childVal;
    frames.push(
      opFrame(
        h,
        `Heapify-up: swap ${childVal} with parent ${parentVal}`,
        `${childVal} ${rel} its parent ${parentVal}, so they swap. Keep bubbling toward the root.`,
        4,
        p,
        [i, p],
      ),
    );
    i = p;
  }
  const tail = frames.at(-1)!;
  tail.note = `${tail.note} Heap property restored — the root holds the ${extreme}.`;
  return { label: `Insert ${value}`, frames };
}

export function heapExtract(heap: number[], kind: HeapKind): HeapOp {
  const { cmp, rel, which, extreme, Extreme, op } = heapWords(kind);
  if (heap.length === 0) {
    return {
      label: `Extract ${Extreme}`,
      frames: [
        opFrame([], `Extract ${Extreme}`, "The heap is empty — nothing to extract.", 9, null, []),
      ],
    };
  }
  const root = heap[0];
  const before = [...heap];
  const frames: OpFrame<number>[] = [
    opFrame(
      before,
      `Extract ${root}`,
      `Remove the root — it holds the ${extreme} element.`,
      9,
      0,
      [0],
    ),
  ];
  if (before.length === 1) {
    frames.push(
      opFrame([], `Extract ${root}`, `${root} extracted — the heap is empty.`, 11, null, []),
    );
    return { label: `Extract ${root}`, frames };
  }
  const last = before[before.length - 1]!;
  const afterMove: number[] = [last, ...before.slice(1, -1)];
  frames.push(
    opFrame<number>(
      afterMove,
      `Move ${last} to the root`,
      `Move the last element to the root so the tree stays complete, then sift it down.`,
      10,
      0,
      [0, before.length - 1],
    ),
  );
  const h = afterMove;
  let i = 0;
  while (true) {
    const l = left(i);
    const r = right(i);
    let best = i;
    if (l < h.length && cmp(h[l]!, h[best]!)) best = l;
    if (r < h.length && cmp(h[r]!, h[best]!)) best = r;
    if (best === i) break;
    const moving = h[i]!;
    const child = h[best]!;
    h[i] = child;
    h[best] = moving;
    frames.push(
      opFrame<number>(
        h,
        `Heapify-down: swap ${moving} with its ${which} child ${child}`,
        `${moving} is not the ${which} among itself and its children — swap with the ${which} child ${child}.`,
        11,
        best,
        [i, best],
      ),
    );
    i = best;
  }
  const tail = frames.at(-1)!;
  tail.note = `${tail.note} ${Extreme} extracted; heap property restored.`;
  return { label: `Extract ${root}`, frames };
}

export function heapPeek(heap: number[], kind: HeapKind): HeapOp {
  const { extreme, peek } = heapWords(kind);
  if (heap.length === 0) {
    return {
      label: `Peek ${extreme.charAt(0).toUpperCase() + extreme.slice(1)}`,
      frames: [
        opFrame([], `Peek ${extreme}`, "The heap is empty — nothing to inspect.", 16, null, []),
      ],
    };
  }
  return {
    label: `Peek ${heap[0]}`,
    frames: [
      opFrame(
        heap,
        `Peek ${heap[0]}`,
        `Peek returns the root ${heap[0]} — the ${extreme} — without removing it. The heap is unchanged.`,
        16,
        0,
        [],
      ),
    ],
  };
}

export function heapDelete(heap: number[], index: number, kind: HeapKind): HeapOp {
  const { cmp, rel, which, extreme, Extreme } = heapWords(kind);
  if (heap.length === 0) {
    return {
      label: "Delete",
      frames: [opFrame([], "Delete", "The heap is empty — nothing to delete.", 19, null, [])],
    };
  }
  if (index < 0 || index >= heap.length) {
    return {
      label: "Delete",
      frames: [
        opFrame(
          heap,
          "Delete",
          `Index ${index} is out of bounds for a heap of size ${heap.length}.`,
          19,
          null,
          [],
        ),
      ],
    };
  }
  const before = [...heap];
  const removed = before[index]!;
  const lastIdx = before.length - 1;
  const last = before[lastIdx]!;
  const frames: OpFrame<number>[] = [
    opFrame(
      before,
      `Delete element at index ${index}`,
      `Swap the selected element ${removed} with the last element ${last}, then remove the last.`,
      19,
      index,
      [index, lastIdx],
    ),
  ];
  if (before.length === 1) {
    frames.push(
      opFrame([], `Delete ${removed}`, `${removed} removed — the heap is empty.`, 20, null, []),
    );
    return { label: `Delete ${removed}`, frames };
  }
  const afterSwap = [...before];
  afterSwap[index] = last;
  const after = afterSwap.slice(0, -1);
  frames.push(
    opFrame(
      after,
      `${removed} removed`,
      `${removed} was removed. Restore the heap property at index ${index} — sift up or down as needed.`,
      20,
      index,
      [index],
    ),
  );
  const h = after;
  let i = index;
  let moved = false;
  while (i > 0) {
    const p = parent(i);
    if (!cmp(h[i]!, h[p]!)) break;
    const childVal = h[i]!;
    const parentVal = h[p]!;
    h[i] = parentVal;
    h[p] = childVal;
    frames.push(
      opFrame(
        h,
        `Heapify-up: swap ${childVal} with parent ${parentVal}`,
        `${childVal} ${rel} its parent ${parentVal}, so they swap.`,
        21,
        p,
        [i, p],
      ),
    );
    i = p;
    moved = true;
  }
  if (!moved) {
    while (true) {
      const l = left(i);
      const r = right(i);
      let best = i;
      if (l < h.length && cmp(h[l]!, h[best]!)) best = l;
      if (r < h.length && cmp(h[r]!, h[best]!)) best = r;
      if (best === i) break;
      const moving = h[i]!;
      const child = h[best]!;
      h[i] = child;
      h[best] = moving;
      frames.push(
        opFrame(
          h,
          `Heapify-down: swap ${moving} with its ${which} child ${child}`,
          `Swap with the ${which} child ${child} to restore the heap property.`,
          21,
          best,
          [i, best],
        ),
      );
      i = best;
    }
  }
  const tail = frames.at(-1)!;
  tail.note = `${tail.note} Heap property restored.`;
  return { label: `Delete ${removed}`, frames };
}

export function heapClear(kind: HeapKind): HeapOp {
  return {
    label: "Clear",
    frames: [opFrame([], "Clear", "The heap is now empty.", 24, null, [])],
  };
}

export function heapToR(heap: number[]): RNode | null {
  if (!heap.length) return null;
  const build = (i: number): RNode | null => {
    if (i >= heap.length) return null;
    return {
      id: i + 1,
      label: String(heap[i]),
      kids: [build(2 * i + 1), build(2 * i + 2)] as [RNode | null, RNode | null],
    };
  };
  return build(0);
}
