import { describe, expect, it } from "vitest";
import { type OpFrame } from "@/lib/linear";
import { stackPush, stackPop, stackPeek, stackIsEmpty, stackClear, stackInvariants } from "./stack";

const final = (op: { frames: OpFrame<number>[] }) => op.frames[op.frames.length - 1]!.state!;
const frame = (op: { frames: OpFrame<number>[] }, i: number): OpFrame<number> => op.frames[i]!;

describe("Stack", () => {
  it("push appends on top, highlighting the new top", () => {
    const op = stackPush([], 5);
    expect(final(op)).toEqual([5]);
    expect(frame(op, 1).focus).toBe(0);

    const op2 = stackPush(final(op), 3);
    expect(final(op2)).toEqual([5, 3]);
    expect(frame(op2, 1).focus).toBe(1); // top
  });

  it("pop removes the top element (LIFO)", () => {
    const op = stackPop([5, 3, 8]);
    expect(frame(op, 0).focus).toBe(2); // top focused while removing
    expect(final(op)).toEqual([5, 3]);
    expect(op.label).toBe("Pop 8");
  });

  it("pop on an empty stack is safe", () => {
    const op = stackPop([]);
    expect(final(op)).toEqual([]);
    expect(frame(op, 0).note).toContain("empty");
  });

  it("peek inspects without mutating", () => {
    const base = [5, 3, 8];
    const op = stackPeek(base);
    expect(frame(op, 0).focus).toBe(2);
    expect(final(op)).toEqual(base);
    expect(base).toEqual([5, 3, 8]); // unchanged
  });

  it("isEmpty reports correctly", () => {
    expect(frame(stackIsEmpty([]), 0).title).toBe("Is empty: yes");
    expect(frame(stackIsEmpty([1]), 0).title).toBe("Is empty: no");
  });

  it("clear empties the stack", () => {
    const op = stackClear([1, 2, 3]);
    expect(final(op)).toEqual([]);
  });

  it("invariants are checked against the shown state", () => {
    const ok = stackInvariants([1, 2, 3]);
    expect(ok.every((c) => c.status === "Satisfied")).toBe(true);
    const empty = stackInvariants(null);
    expect(empty.every((c) => c.status === "Not Checked")).toBe(true);
  });
});
