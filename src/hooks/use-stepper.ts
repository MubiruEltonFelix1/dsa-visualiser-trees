import { useEffect, useRef, useState } from "react";

/** One timer at a time, re-armed from state each step — pause/step can never race. */
export function useStepper(length: number, opts: { min?: number; delay: number; resetKey: unknown; initial?: number; autoplayOnReset?: boolean }) {
  const min = opts.min ?? -1;
  const last = length - 1;
  const [step, setStep] = useState(opts.initial ?? min);
  const [playing, setPlaying] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStep(min);
    setPlaying(!!opts.autoplayOnReset && length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.resetKey]);
  useEffect(() => () => setPlaying(false), []);

  useEffect(() => {
    if (!playing) return;
    if (step >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => Math.min(last, s + 1)), step === min ? 200 : opts.delay);
    return () => clearTimeout(t);
  }, [playing, step, last, opts.delay, min]);

  const s = Math.min(step, Math.max(min, last));
  return {
    step: s, playing, min, length,
    done: length > 0 && s >= last, atStart: s <= min,
    play: () => { if (s >= last) setStep(min); setPlaying(true); },
    pause: () => setPlaying(false),
    next: () => { setPlaying(false); setStep((x) => Math.min(last, x + 1)); },
    prev: () => { setPlaying(false); setStep((x) => Math.max(min, x - 1)); },
    reset: () => { setPlaying(false); setStep(min); },
    goto: (i: number) => { setPlaying(false); setStep(i); },
  };
}
export type Stepper = ReturnType<typeof useStepper>;
