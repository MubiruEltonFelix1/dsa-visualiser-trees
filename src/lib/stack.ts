// Stack model — genuine LIFO structure backed by an array.
// Index 0 is the bottom, the last index is the top. Every operation
// returns an immutable sequence of frames the UI can step through.
import type { Op } from "./linear";
import { opFrame } from "./linear";
import type { Invariant } from "./invariants";

export type StackOp = Op<number>;

export const STACK_CODE = [
  "function push(stack, value):",
  "    stack.append(value)   // place value on top",
  "    top := stack.length - 1",
  "",
  "function pop(stack):",
  "    if stack is empty: error",
  "    value := stack[top]   // read the top element",
  "    stack.remove(top)     // remove it",
  "    return value",
  "",
  "function peek(stack):",
  "    return stack[top]    // inspect without removing",
  "",
  "function isEmpty(stack):",
  "    return stack.length === 0",
  "",
  "function clear(stack):",
  "    stack := []           // empty the stack",
];

export const STACK_EXPLAIN = [
  "A stack is a Last In, First Out (LIFO) structure.",
  "The most recently pushed element is always at the top and is the first to be popped.",
  "Push appends to the top, pop removes from the top, and peek inspects the top without removing it.",
  "All operations touch only the top, so push, pop and peek run in O(1) time.",
];

export function stackStats(stack: number[]): [string, string | number][] {
  const top = stack.length ? stack[stack.length - 1] : null;
  return [
    ["Size", stack.length],
    ["Top element", top ?? "—"],
    ["Push", "O(1)"],
    ["Pop", "O(1)"],
    ["Peek", "O(1)"],
  ];
}

export function stackInvariants(stack: number[] | null): Invariant[] {
  const empty = !stack || stack.length === 0;
  const top = stack ? stack[stack.length - 1] : null;
  const check = (
    name: string,
    explanation: string,
    failed: number[],
    violation: string,
  ): Invariant => ({
    name,
    explanation,
    scope: "Shared structure",
    status: empty ? "Not Checked" : failed.length ? "Violated" : "Satisfied",
    nodeIds: [...new Set(failed)],
    ...(failed.length ? { violation } : {}),
  });
  return [
    check(
      "LIFO ordering",
      "Elements are stored bottom→top in insertion order; the top is the last element pushed.",
      stack && stack[stack.length - 1] !== top ? [stack.length - 1] : [],
      "The top element is not the most recently inserted element.",
    ),
    check(
      "Top points to the most recent insert",
      "The top index always holds the element pushed most recently.",
      top === null && stack ? [stack.length - 1] : [],
      "The top element is missing while the stack is non-empty.",
    ),
    check(
      "Size matches element count",
      "The reported size equals the number of stored elements.",
      [],
      "The reported size differs from the stored element count.",
    ),
  ];
}

export function stackPush(stack: number[], value: number): StackOp {
  const before = [...stack];
  const after = [...before, value];
  const topIndex = after.length - 1;
  return {
    label: `Push ${value}`,
    frames: [
      opFrame(
        before,
        `Push ${value}`,
        `Append ${value} to the top of the stack. LIFO — the last element pushed is the first to be popped.`,
        1,
        null,
        [],
      ),
      opFrame(
        after,
        `${value} is now on top`,
        `${value} becomes the top element. Stack size: ${after.length}.`,
        1,
        topIndex,
        [topIndex],
      ),
    ],
  };
}

export function stackPop(stack: number[]): StackOp {
  if (stack.length === 0) {
    return {
      label: "Pop",
      frames: [opFrame([], "Pop", "The stack is empty — nothing to remove.", 4, null, [])],
    };
  }
  const top = stack[stack.length - 1];
  const after = stack.slice(0, -1);
  const newTop = after.length ? after[after.length - 1] : null;
  return {
    label: `Pop ${top}`,
    frames: [
      opFrame(
        stack,
        `Pop ${top}`,
        `Remove the top element ${top} — the last one pushed (LIFO).`,
        6,
        stack.length - 1,
        [stack.length - 1],
      ),
      opFrame(
        after,
        `${top} removed`,
        `${top} was popped. New top: ${newTop ?? "none"}. Size: ${after.length}.`,
        7,
        after.length ? after.length - 1 : null,
        [],
      ),
    ],
  };
}

export function stackPeek(stack: number[]): StackOp {
  if (stack.length === 0) {
    return {
      label: "Peek",
      frames: [opFrame([], "Peek", "The stack is empty — nothing to inspect.", 11, null, [])],
    };
  }
  const top = stack[stack.length - 1];
  return {
    label: `Peek ${top}`,
    frames: [
      opFrame(
        stack,
        `Peek ${top}`,
        `Peek returns the top element without removing it. The stack is unchanged.`,
        11,
        stack.length - 1,
        [stack.length - 1],
      ),
    ],
  };
}

export function stackIsEmpty(stack: number[]): StackOp {
  const empty = stack.length === 0;
  return {
    label: "Is empty",
    frames: [
      opFrame(
        stack,
        empty ? "Is empty: yes" : `Is empty: no`,
        empty ? "The stack contains no elements." : `The stack holds ${stack.length} element(s).`,
        14,
        null,
        [],
      ),
    ],
  };
}

export function stackClear(stack: number[]): StackOp {
  return {
    label: "Clear",
    frames: [opFrame([], "Clear", "The stack is now empty.", 17, null, [])],
  };
}
