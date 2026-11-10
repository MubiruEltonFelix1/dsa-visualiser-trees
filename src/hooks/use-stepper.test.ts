import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStepper } from './use-stepper';

afterEach(() => vi.useRealTimers());
describe('reversible operation playback', () => {
  it('Previous returns the exact earlier frame index and Next restores it', () => {
    const { result } = renderHook(() => useStepper(5, { min: 0, delay: 500, resetKey: 1 }));
    act(() => result.current.goto(3));
    act(() => result.current.prev()); expect(result.current.step).toBe(2);
    act(() => result.current.next()); expect(result.current.step).toBe(3);
    act(() => result.current.reset()); expect(result.current.step).toBe(0);
  });
  it('Play completes at the final snapshot and Pause cancels progression', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepper(3, { min: 0, delay: 500, resetKey: 1 }));
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(200)); expect(result.current.step).toBe(1);
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(1000)); expect(result.current.step).toBe(1);
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(500)); expect(result.current.step).toBe(2); expect(result.current.playing).toBe(false);
  });
});