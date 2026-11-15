// Shared snapshot model for the linear and priority data structures
// (stack, queue, min heap, max heap). Each operation returns an immutable
// sequence of frames; the UI steps through them with the same useStepper
// used by the tree labs, so Previous Step restores the exact prior state.

export interface OpFrame<T> {
  state: T[] | null; // snapshot of the structure in array form (null = empty)
  title: string;
  note: string; // what is happening at this step
  line: number; // pseudocode line to highlight (0-based)
  focus: number | null; // index of the element acted on / inspected
  path: number[]; // additional indices involved (swaps, entering, leaving)
  context: Record<string, string | number | null>;
}
export interface Op<T> {
  label: string;
  frames: OpFrame<T>[];
}

export function opFrame<T>(
  state: T[] | null,
  title: string,
  note: string,
  line: number,
  focus: number | null = null,
  path: number[] = [],
  context: Record<string, string | number | null> = {},
): OpFrame<T> {
  return { state: state ? [...state] : null, title, note, line, focus, path, context };
}
