import { describe, expect, it } from "vitest";
import { type OpFrame } from "@/lib/linear";
import type { RNode } from "@/lib/traversal";
import { heapInsert, heapExtract, heapPeek, heapDelete, heapClear } from "./heap";
import { heapToR } from "./heap";
import { heapInvariants } from "./invariants";

const final = (op: { frames: OpFrame<number>[] }) => op.frames[op.frames.length - 1]!.state!;

function isMinHeap(heap: number[]): boolean {
  for (let i = 0; i < heap.length; i++) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < heap.length && heap[i]! > heap[l]!) return false;
    if (r < heap.length && heap[i]! > heap[r]!) return false;
  }
  return true;
}

function isMaxHeap(heap: number[]): boolean {
  for (let i = 0; i < heap.length; i++) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < heap.length && heap[i]! < heap[l]!) return false;
    if (r < heap.length && heap[i]! < heap[r]!) return false;
  }
  return true;
}

describe("Min heap", () => {
  it("insert keeps the minimum at the root and the tree complete", () => {
    let heap: number[] = [];
    for (const v of [5, 3, 8, 1, 6]) {
      const op = heapInsert(heap, v, "min");
      heap = final(op);
      expect(isMinHeap(heap)).toBe(true);
    }
    expect(heap[0]).toBe(1);
    expect(heap).toEqual([1, 3, 8, 5, 6]);
  });

  it("insert animates every swap", () => {
    const op = heapInsert([3, 5, 8], 1, "min");
    // append then two swaps bubble 1 to the root
    expect(op.frames.length).toBe(3);
    expect(final(op)).toEqual([1, 3, 8, 5]);
    expect(op.frames[1]!.title).toContain("Heapify-up");
    expect(op.frames[1]!.path.sort()).toEqual([1, 3]);
  });

  it("extract removes the root and sifts down", () => {
    const op = heapExtract([1, 3, 5, 8, 6], "min");
    expect(op.label).toBe("Extract 1");
    expect(final(op)).toEqual([3, 6, 5, 8]);
    expect(isMinHeap(final(op))).toBe(true);
  });

  it("extract on empty is safe", () => {
    const op = heapExtract([], "min");
    expect(final(op)).toEqual([]);
  });

  it("peek returns the root without mutating", () => {
    const base = [1, 3, 5];
    const op = heapPeek(base, "min");
    expect(op.frames[0]!.focus).toBe(0);
    expect(final(op)).toEqual(base);
    expect(base).toEqual([1, 3, 5]);
  });

  it("delete removes an element at an index and restores the heap", () => {
    const op = heapDelete([1, 3, 5, 8, 6], 2, "min"); // delete 5
    expect(final(op)).toEqual([1, 3, 6, 8]);
    expect(isMinHeap(final(op))).toBe(true);
  });

  it("delete the root reheapifies", () => {
    const op = heapDelete([1, 3, 5, 8, 6], 0, "min");
    expect(final(op)).toEqual([3, 6, 5, 8]);
    expect(isMinHeap(final(op))).toBe(true);
  });

  it("clear empties the heap", () => {
    const op = heapClear("min");
    expect(final(op)).toEqual([]);
  });

  it("invariants hold for a valid heap", () => {
    const checks = heapInvariants([1, 3, 5, 8, 6], "min");
    expect(checks.every((c) => c.status === "Satisfied")).toBe(true);
  });

  it("invariant rejects a parent greater than its child", () => {
    const checks = heapInvariants([3, 1, 8], "min");
    const rule = checks.find((c) => c.name.startsWith("Min-heap property"))!;
    expect(rule.status).toBe("Violated");
    expect(rule.nodeIds).toContain(0);
  });

  it("invariants are Not Checked when empty", () => {
    const checks = heapInvariants(null, "min");
    expect(checks.every((c) => c.status === "Not Checked")).toBe(true);
  });

  it("heapToR renders the level-order array as a tree", () => {
    const root = heapToR([1, 3, 5, 8, 6]);
    expect(root).not.toBeNull();
    const bfs: number[] = [];
    const pending: RNode[] = [root!];
    while (pending.length) {
      const n = pending.shift()!;
      bfs.push(Number(n.label));
      for (const c of n.kids) if (c) pending.push(c);
    }
    expect(bfs).toEqual([1, 3, 5, 8, 6]);
  });
});

describe("Max heap", () => {
  it("insert keeps the maximum at the root", () => {
    let heap: number[] = [];
    for (const v of [5, 3, 8, 1, 9]) {
      const op = heapInsert(heap, v, "max");
      heap = final(op);
      expect(isMaxHeap(heap)).toBe(true);
    }
    expect(heap[0]).toBe(9);
  });

  it("extract removes the maximum", () => {
    const op = heapExtract([9, 8, 5, 3, 1], "max");
    expect(op.label).toBe("Extract 9");
    expect(isMaxHeap(final(op))).toBe(true);
    expect(final(op)[0]).toBe(8);
  });

  it("invariants hold for a valid max heap", () => {
    const checks = heapInvariants([9, 8, 5, 3, 1], "max");
    expect(checks.every((c) => c.status === "Satisfied")).toBe(true);
  });

  it("invariant rejects a parent smaller than its child", () => {
    const checks = heapInvariants([3, 8, 5], "max");
    const rule = checks.find((c) => c.name.startsWith("Max-heap property"))!;
    expect(rule.status).toBe("Violated");
    expect(rule.nodeIds).toContain(0);
  });
});
