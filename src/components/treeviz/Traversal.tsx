import { useMemo } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useStepper, type Stepper } from "@/hooks/use-stepper";
import { ALGORITHMS, algorithmsFor, traverse, type Algorithm, type Mode, type RNode } from "@/lib/traversal";
import { Section } from "./Section";

export const speedToDelay = (speed: number) => 1600 - speed * 14;

export function useTraversal(root: RNode | null, mode: Mode, algo: Algorithm, speed: number) {
  const steps = useMemo(() => traverse(root, algo, mode), [root, algo, mode]);
  const st = useStepper(steps.length, { delay: speedToDelay(speed), resetKey: steps });
  const visited = useMemo(() => new Set(steps.slice(0, Math.max(0, st.step)).map((s) => s.id)), [steps, st.step]);
  const current = st.step >= 0 ? steps[st.step] : undefined;
  return { steps, st, visited, current, meta: ALGORITHMS[mode][algo]!, sequence: steps.slice(0, st.step + 1).map((s) => s.label) };
}
export type TraversalState = ReturnType<typeof useTraversal>;

export function PlaybackButtons({ st, disabled }: { st: Stepper; disabled: boolean }) {
  return (
    <>
      <Button size="icon" variant="secondary" title="Previous step" aria-label="Previous step" disabled={disabled || st.atStart} onClick={st.prev}><ChevronLeft /></Button>
      {st.playing ? (
        <Button onClick={st.pause} title="Pause"><Pause /> Pause</Button>
      ) : (
        <Button onClick={st.play} disabled={disabled} title="Play / resume"><Play /> {!st.atStart && !st.done ? "Resume" : "Play"}</Button>
      )}
      <Button size="icon" variant="secondary" title="Next step" aria-label="Next step" disabled={disabled || st.done} onClick={st.next}><ChevronRight /></Button>
      <Button variant="outline" title="Reset" disabled={disabled || st.atStart} onClick={st.reset}><RotateCcw /> Reset</Button>
    </>
  );
}

export function SpeedSlider({ speed, setSpeed }: { speed: number; setSpeed: (n: number) => void }) {
  return (
    <div className="ml-auto flex w-full min-w-0 items-center gap-3 sm:w-[200px]">
      <span className="text-xs text-muted-foreground">Slow</span>
      <Slider value={[speed]} min={0} max={100} step={1} onValueChange={([v]) => setSpeed(v ?? 50)} className="flex-1" aria-label="Animation speed" />
      <span className="text-xs text-muted-foreground">Fast</span>
    </div>
  );
}

interface ControlsProps { t: TraversalState; mode: Mode; algo: Algorithm; setAlgo: (a: Algorithm) => void; speed: number; setSpeed: (n: number) => void; empty: boolean }
export function TraversalControls({ t, mode, algo, setAlgo, speed, setSpeed, empty }: ControlsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {algorithmsFor(mode).map((a) => (
          <Button key={a} size="sm" variant={a === algo ? "default" : "secondary"} onClick={() => setAlgo(a)}>{ALGORITHMS[mode][a]!.name}</Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t.meta.short}</p>
      <div className="flex flex-wrap items-center gap-2">
        <PlaybackButtons st={t.st} disabled={empty} />
        <SpeedSlider speed={speed} setSpeed={setSpeed} />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-[auto_auto_1fr]">
        <div className="rounded-lg bg-secondary px-3 py-2"><span className="text-muted-foreground">Progress: </span>
          <span className="font-mono font-semibold">Step {Math.max(0, t.st.step + 1)} of {t.steps.length}</span></div>
        <div className="rounded-lg bg-secondary px-3 py-2"><span className="text-muted-foreground">Current: </span>
          <span className="font-mono font-semibold text-primary">{t.current?.label ?? "—"}</span></div>
        <div className="rounded-lg bg-secondary px-3 py-2 break-words"><span className="text-muted-foreground">Traversal Sequence: </span>
          <span className="font-mono">{t.sequence.length ? t.sequence.map((v, i) => (
            <span key={i} className={i === t.sequence.length - 1 ? "text-primary" : "text-success"}>{i ? " → " : ""}{v}</span>
          )) : "—"}</span></div>
      </div>
    </div>
  );
}

export function AlgorithmPanel({ t, title, empty }: { t: TraversalState; title: string; empty: boolean }) {
  const { meta, current } = t;
  return (
    <>
      <Section title={title}>
        <h2 className="text-lg font-semibold">{meta.name}</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">{meta.explain.map((e) => <li key={e}>{e}</li>)}</ol>
        <pre className="mt-4 overflow-x-auto rounded-lg border bg-background p-3 font-mono text-xs leading-6">
          {meta.code.map((l, i) => (
            <div key={i} className={`rounded px-2 transition-colors ${current && current.line === i ? "bg-primary/20 text-primary" : ""}`}>{l}</div>
          ))}
        </pre>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <div className="text-xs text-muted-foreground">Current step</div>
          <div>{current?.note ?? (empty ? "Build a tree to begin." : "Press Play or Next Step to start.")}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-secondary px-3 py-2"><div className="text-xs text-muted-foreground">Time</div><div className="font-mono">{meta.time}</div></div>
          <div className="rounded-lg bg-secondary px-3 py-2"><div className="text-xs text-muted-foreground">Auxiliary space</div><div className="font-mono">{meta.space}</div></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">n = nodes, h = height, w = maximum level width.</p>
      </Section>
      {t.st.done && (
        <Section title="Results">
          <div className="flex items-center gap-2 text-success"><CheckCircle2 className="size-5" /><span className="font-semibold">Traversal complete!</span></div>
          <p className="mt-2 text-sm text-muted-foreground">Visited {t.steps.length} nodes in {meta.name.toLowerCase()} order:</p>
          <p className="mt-2 rounded-lg bg-secondary px-3 py-2 font-mono text-sm break-words">{t.steps.map((s) => s.label).join(" → ")}</p>
          <Button className="mt-3 w-full" onClick={t.st.play}><RotateCcw /> Replay</Button>
        </Section>
      )}
    </>
  );
}
