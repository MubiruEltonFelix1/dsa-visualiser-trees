// Queue model — genuine FIFO structure backed by an array.
// Index 0 is the front, the last index is the rear. Every operation
// returns an immutable sequence of frames the UI can step through.
import type { Op } from "./linear";
import { opFrame } from "./linear";
import type { Invariant } from "./invariants";

export type QueueOp = Op<number>;

export const QUEUE_CODE = [
  "function enqueue(queue, value):",
  "    queue.append(value)   // add at the rear",
  "    rear := queue.length - 1",
  "",
  "function dequeue(queue):",
  "    if queue is empty: error",
  "    value := queue[front] // the first element enqueued",
  "    queue.remove(front)   // shift remaining elements forward",
  "    return value",
  "",
  "function front(queue):",
  "    return queue[0]       // inspect without removing",
  "",
  "function rear(queue):",
  "    return queue[queue.length - 1] // inspect without removing",
  "",
  "function isEmpty(queue):",
  "    return queue.length === 0",
  "",
  "function clear(queue):",
  "    queue := []           // empty the queue",
];

export const QUEUE_EXPLAIN = [
  "A queue is a First In, First Out (FIFO) structure.",
  "Elements enter at the rear and leave from the front, like a line at a counter.",
  "Enqueue appends at the rear, dequeue removes from the front, and front/rear inspect the ends without removing them.",
  "Enqueue is O(1); dequeue is O(n) because the remaining elements shift forward after the front is removed.",
];

export function queueStats(queue: number[]): [string, string | number][] {
  return [
    ["Size", queue.length],
    ["Front element", queue.length ? queue[0]! : "—"],
    ["Rear element", queue.length ? queue[queue.length - 1]! : "—"],
    ["Enqueue", "O(1)"],
    ["Dequeue", "O(n)"],
  ];
}

export function queueInvariants(queue: number[] | null): Invariant[] {
  const empty = !queue || queue.length === 0;
  const front = queue ? queue[0] : null;
  const rear = queue ? queue[queue.length - 1] : null;
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
      "FIFO ordering",
      "Elements are stored front→rear in enqueue order; the front is the first element enqueued.",
      queue && (queue[0] !== front || queue[queue.length - 1] !== rear)
        ? [0, queue.length - 1]
        : [],
      "The front or rear element does not match the stored sequence.",
    ),
    check(
      "Front and rear positions are valid",
      "A non-empty queue has a first element (front) and a last element (rear).",
      (front === null || rear === null) && queue ? [0] : [],
      "Front or rear is missing while the queue is non-empty.",
    ),
    check(
      "Size matches element count",
      "The reported size equals the number of stored elements.",
      [],
      "The reported size differs from the stored element count.",
    ),
  ];
}

export function queueEnqueue(queue: number[], value: number): QueueOp {
  const before = [...queue];
  const after = [...before, value];
  const rearIndex = after.length - 1;
  return {
    label: `Enqueue ${value}`,
    frames: [
      opFrame(
        before,
        `Enqueue ${value}`,
        `Append ${value} at the rear of the queue. FIFO — the first element enqueued is the first to leave.`,
        1,
        null,
        [],
      ),
      opFrame(
        after,
        `${value} is now at the rear`,
        `${value} becomes the rear element. Queue size: ${after.length}.`,
        1,
        rearIndex,
        [rearIndex],
      ),
    ],
  };
}

export function queueDequeue(queue: number[]): QueueOp {
  if (queue.length === 0) {
    return {
      label: "Dequeue",
      frames: [opFrame([], "Dequeue", "The queue is empty — nothing to remove.", 4, null, [])],
    };
  }
  const front = queue[0];
  const after = queue.slice(1);
  const newFront = after.length ? after[0] : null;
  return {
    label: `Dequeue ${front}`,
    frames: [
      opFrame(
        queue,
        `Dequeue ${front}`,
        `Remove the front element ${front} — the first one enqueued (FIFO). The remaining elements shift forward.`,
        6,
        0,
        [0],
      ),
      opFrame(
        after,
        `${front} removed`,
        `${front} was dequeued. New front: ${newFront ?? "none"}. Size: ${after.length}.`,
        7,
        after.length ? 0 : null,
        [],
      ),
    ],
  };
}

export function queueFront(queue: number[]): QueueOp {
  if (queue.length === 0) {
    return {
      label: "Front",
      frames: [opFrame([], "Front", "The queue is empty — nothing to inspect.", 11, null, [])],
    };
  }
  return {
    label: `Front ${queue[0]}`,
    frames: [
      opFrame(
        queue,
        `Front ${queue[0]}`,
        `Front inspects the first element without removing it. The queue is unchanged.`,
        11,
        0,
        [0],
      ),
    ],
  };
}

export function queueRear(queue: number[]): QueueOp {
  if (queue.length === 0) {
    return {
      label: "Rear",
      frames: [opFrame([], "Rear", "The queue is empty — nothing to inspect.", 14, null, [])],
    };
  }
  const last = queue.length - 1;
  return {
    label: `Rear ${queue[last]}`,
    frames: [
      opFrame(
        queue,
        `Rear ${queue[last]}`,
        `Rear inspects the last element without removing it. The queue is unchanged.`,
        14,
        last,
        [last],
      ),
    ],
  };
}

export function queueIsEmpty(queue: number[]): QueueOp {
  const empty = queue.length === 0;
  return {
    label: "Is empty",
    frames: [
      opFrame(
        queue,
        empty ? "Is empty: yes" : `Is empty: no`,
        empty ? "The queue contains no elements." : `The queue holds ${queue.length} element(s).`,
        17,
        null,
        [],
      ),
    ],
  };
}

export function queueClear(queue: number[]): QueueOp {
  return {
    label: "Clear",
    frames: [opFrame([], "Clear", "The queue is now empty.", 20, null, [])],
  };
}
