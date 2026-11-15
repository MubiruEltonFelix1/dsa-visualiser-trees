import { describe, expect, it } from "vitest";
import { type OpFrame } from "@/lib/linear";
import {
  queueEnqueue,
  queueDequeue,
  queueFront,
  queueRear,
  queueIsEmpty,
  queueClear,
  queueInvariants,
} from "./queue";

const final = (op: { frames: OpFrame<number>[] }) => op.frames[op.frames.length - 1]!.state!;
const frame = (op: { frames: OpFrame<number>[] }, i: number): OpFrame<number> => op.frames[i]!;

describe("Queue", () => {
  it("enqueue appends at the rear, highlighting the new rear", () => {
    const op = queueEnqueue([], 10);
    expect(final(op)).toEqual([10]);
    expect(frame(op, 1).focus).toBe(0);

    const op2 = queueEnqueue(final(op), 20);
    expect(final(op2)).toEqual([10, 20]);
    expect(frame(op2, 1).focus).toBe(1); // rear
    expect(op2.label).toBe("Enqueue 20");
  });

  it("dequeue removes from the front (FIFO)", () => {
    const op = queueDequeue([10, 20, 30]);
    expect(frame(op, 0).focus).toBe(0); // front focused while removing
    expect(final(op)).toEqual([20, 30]);
    expect(op.label).toBe("Dequeue 10");
  });

  it("dequeue on an empty queue is safe", () => {
    const op = queueDequeue([]);
    expect(final(op)).toEqual([]);
    expect(frame(op, 0).note).toContain("empty");
  });

  it("front and rear inspect without mutating", () => {
    const base = [10, 20, 30];
    expect(frame(queueFront(base), 0).focus).toBe(0);
    expect(frame(queueRear(base), 0).focus).toBe(2);
    expect(base).toEqual([10, 20, 30]); // unchanged
  });

  it("isEmpty reports correctly", () => {
    expect(frame(queueIsEmpty([]), 0).title).toBe("Is empty: yes");
    expect(frame(queueIsEmpty([1]), 0).title).toBe("Is empty: no");
  });

  it("clear empties the queue", () => {
    const op = queueClear([1, 2, 3]);
    expect(final(op)).toEqual([]);
  });

  it("invariants are checked against the shown state", () => {
    const ok = queueInvariants([1, 2, 3]);
    expect(ok.every((c) => c.status === "Satisfied")).toBe(true);
    const empty = queueInvariants(null);
    expect(empty.every((c) => c.status === "Not Checked")).toBe(true);
  });
});
