import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Minus, Search, Trash2, History, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStepper } from '@/hooks/use-stepper';
import { parseValues } from '@/lib/bst';
import type { AdvancedAdapter, TreeOperation } from '@/lib/tree-operation';
import { TreeCanvas } from './TreeCanvas';
import { Section, type Notify } from './Section';
import { PlaybackButtons, SpeedSlider, speedToDelay } from './Traversal';
import type { Invariant } from '@/lib/invariants';
import { Invariants, violationIds } from './Invariants';

export interface AdvancedState<T> { root: T | null; op: TreeOperation<T> | null; history: TreeOperation<T>[] }
interface Props<T> { adapter: AdvancedAdapter<T>; state: AdvancedState<T>; setState: (state: AdvancedState<T>) => void; speed: number; setSpeed: (n: number) => void; notify: Notify; checkInvariants: (root: T | null) => Invariant[] }
export function AdvancedLab<T>({ adapter, state, setState, speed, setSpeed, notify, checkInvariants }: Props<T>) {
  const [list, setList] = useState('');
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  const frames = state.op?.frames ?? [];
  const st = useStepper(frames.length, { min: 0, initial: Math.max(0, frames.length - 1), resetKey: state.op, delay: speedToDelay(speed), autoplayOnReset: true });
  const frame = frames[st.step];
  const shown = frame ? frame.tree : state.root;
  const rendered = useMemo(() => adapter.render(shown), [adapter, shown]);
  const checks = useMemo(() => checkInvariants(shown), [checkInvariants, shown]);
  const errors = useMemo(() => adapter.validate(shown), [adapter, shown]);
  const finalErrors = useMemo(() => adapter.validate(state.root), [adapter, state.root]);
  const stats = adapter.stats(shown);
  const activeIndex = state.op ? state.history.indexOf(state.op) : -1;
  const prior = state.history.slice(0, Math.max(0, activeIndex));
  const rotations = prior.reduce((n, o) => n + o.rotations, 0) + (frame?.rotations ?? 0);
  const recolors = prior.reduce((n, o) => n + o.recolors, 0) + (frame?.recolors ?? 0);
  const apply = (op: TreeOperation<T>, baseHistory = state.history) => {
    const invalid = adapter.validate(op.after);
    if (invalid.length) { notify.fail(`Operation rejected: ${invalid.join(' ')}`); return; }
    setState({ root: op.after, op, history: [...baseHistory, op] });
  };
  const one = (text: string) => {
    const p = parseValues(text);
    if (p.error) { notify.fail(p.error); return null; }
    if (p.values.length !== 1) { notify.fail('Enter exactly one number.'); return null; }
    return p.values[0] ?? null;
  };
  return (
    <main className="tree-workspace mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="min-w-0 space-y-4">
        <Section title={`${adapter.name} operations`}>
          <form className="space-y-2" onSubmit={e => { e.preventDefault(); const p = parseValues(list); if (p.error) return notify.fail(p.error); apply(adapter.insert(state.root, p.values)); }}>
            <label className="text-xs text-muted-foreground" htmlFor="advanced-list">Insert a sequence</label>
            <Input id="advanced-list" aria-label="Insert sequence" value={list} onChange={e => setList(e.target.value)} placeholder="30, 10, 20, 40" className="font-mono" />
            <Button type="submit" className="w-full"><Plus /> Insert sequence</Button>
          </form>
          <form className="mt-4 space-y-2" onSubmit={e => { e.preventDefault(); const v = one(value); if (v !== null) apply(adapter.insert(state.root, [v])); }}>
            <label className="text-xs text-muted-foreground" htmlFor="advanced-value">Single key</label>
            <Input id="advanced-value" type="number" aria-label="Single key" value={value} onChange={e => setValue(e.target.value)} placeholder="Key" className="font-mono" />
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" className="flex-1"><Plus /> Insert</Button>
              <Button type="button" variant="secondary" className="flex-1" disabled={!state.root} onClick={() => { const v = one(value); if (v !== null) apply(adapter.remove(state.root, v)); }}><Minus /> Delete</Button>
            </div>
          </form>
          <form className="mt-4 space-y-2" onSubmit={e => { e.preventDefault(); const v = one(search); if (v !== null) apply(adapter.search(state.root, v)); }}>
            <label className="text-xs text-muted-foreground" htmlFor="advanced-search">Search key</label>
            <div className="flex gap-2">
              <Input id="advanced-search" aria-label="Search key" type="number" value={search} onChange={e => setSearch(e.target.value)} placeholder="Key" className="min-w-0 font-mono" />
              <Button type="submit" variant="outline" size="icon" title="Search" aria-label="Search"><Search /></Button>
            </div>
          </form>
          <Button variant="destructive" className="mt-4 w-full" disabled={!state.root && !state.history.length} onClick={() => { st.pause(); setState({ root: null, op: null, history: [] }); }}><Trash2 /> Clear tree</Button>
        </Section>
        <Section title="Examples">
          <div className="flex flex-wrap gap-1.5">
            {adapter.examples.map(ex => <Button key={ex.label} variant="outline" size="sm" title={`${ex.values.join(', ')}${ex.delete !== undefined ? `; delete ${ex.delete}` : ''}`} onClick={() => {
              const built = adapter.insert(null, ex.values);
              if (ex.delete !== undefined) apply({ ...adapter.remove(built.after, ex.delete), label: `${ex.label}: delete ${ex.delete}` }, [built]);
              else apply({ ...built, label: ex.label }, []);
            }}>{ex.label}</Button>)}
          </div>
        </Section>
        <Section title="Tree information · shown state">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[...stats, ...(adapter.binary ? [['Rotations', rotations], ['Recolorings', recolors]] as [string, number][] : [])].map(([k,v]) => <div key={k} className="rounded-md bg-secondary px-3 py-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words font-mono text-lg font-semibold">{v}</dd></div>)}
          </dl>
          <div className={`mt-3 text-xs ${errors.length ? 'text-selected' : 'text-success'}`}>{errors.length ? `Temporary repair state: ${[...new Set(errors)].join(' ')}` : <span className="flex items-center gap-1"><CheckCircle2 className="size-4" /> All invariants hold</span>}</div>
          {finalErrors.length > 0 && <p className="mt-2 text-xs text-destructive">Final tree invalid: {finalErrors.join(' ')}</p>}
        </Section>
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="tree-stage h-[55vh] min-h-[360px] lg:h-[calc(100vh-300px)]">
          <TreeCanvas root={rendered} binary={adapter.binary} currentId={frame?.focus ?? null} visited={new Set(frame?.path ?? [])} violationIds={violationIds(checks)} empty={<>
            <Network className="size-10 text-primary" /><h2 className="text-xl font-semibold">{adapter.name}</h2>
            <Button onClick={() => apply(adapter.insert(null, [10,20,30]))}>Load example tree</Button>
          </>} />
        </div>
        <section className="panel space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2"><PlaybackButtons st={st} disabled={frames.length < 2} /><SpeedSlider speed={speed} setSpeed={setSpeed} /></div>
          <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-mono">Step {frames.length ? st.step + 1 : 0} of {frames.length}</span><span className="min-w-0 break-words text-muted-foreground">{state.op?.label ?? 'No operation yet'}</span></div>
          {frames.length > 1 && <input type="range" min={0} max={frames.length-1} value={st.step} onChange={e => st.goto(Number(e.target.value))} aria-label="Operation timeline" className="w-full accent-primary" />}
          {adapter.binary && <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-3 rounded-full border border-rb-outline bg-rb-red" />Red</span><span className="flex items-center gap-2"><span className="size-3 rounded-full border border-rb-outline bg-rb-black" />Black</span><span>NIL leaves: black, not drawn</span><span className="text-primary">Current node</span><span className="text-success">Search path</span></div>}
        </section>
      </div>
      <aside className="min-w-0 space-y-4 lg:col-span-2 xl:col-span-1">
        <Invariants checks={checks} />
        <Section title="What's happening">
          <h2 className="text-lg font-semibold">{frame?.title ?? 'Waiting for an operation'}</h2>
          {frame && <><p className="mt-2 text-sm text-muted-foreground">{frame.note}</p><p className="mt-3 border-l-2 border-primary pl-3 text-xs text-muted-foreground">{frame.property}</p></>}
          {frame?.context && <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">{Object.entries(frame.context).map(([key,v]) => <div key={key}><dt className="capitalize text-muted-foreground">{key}</dt><dd className="font-mono">{v ?? 'NIL (black)'}</dd></div>)}</dl>}
          {state.op && <pre className="mt-4 overflow-x-auto rounded-md border bg-background p-2 font-mono text-xs leading-6">{adapter.code[state.op.kind].map((line,i) => <div key={i} className={`px-2 ${frame?.line === i ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>{line}</div>)}</pre>}
        </Section>
        <Section title="Operation history">
          <ol className="max-h-64 space-y-1 overflow-y-auto">{state.history.map((op,i) => <li key={i}><Button variant={state.op === op ? 'secondary' : 'ghost'} className="h-auto w-full justify-start whitespace-normal py-2 text-left text-xs" onClick={() => setState({ ...state, op })}><History className="shrink-0" /><span className="min-w-0 break-words">{i+1}. {op.label}</span></Button></li>)}</ol>
        </Section>
        <Section title="Complexity & comparison">
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-muted-foreground"><th className="text-left">Tree</th><th>Operations¹</th><th>Height</th></tr></thead><tbody>
            {[['BST','O(n)','O(n)'],['AVL','O(log n)','O(log n)'],['2–3','O(log n)','O(log n)'],['Red-Black','O(log n)','O(log n)']].map(([name,ops,h]) => <tr key={name}><td className="py-1.5">{name}</td><td className="text-center font-mono">{ops}</td><td className="text-center font-mono">{h}</td></tr>)}
          </tbody></table></div>
          <p className="mt-2 text-xs text-muted-foreground">¹ Worst-case search, insertion, and deletion. General trees have no key-order rule; locating a key may visit all n nodes.</p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground"><li><span className="font-semibold text-foreground">2–3:</span> splitting, promotion, borrowing, and merging keep every leaf at the same depth; a height-h tree stores between 2^(h+1)−1 and 3^(h+1)−1 keys.</li><li><span className="font-semibold text-foreground">Red-Black:</span> recoloring and rotations preserve equal black height and prohibit adjacent red nodes. Height is at most 2 log₂(n+1).</li><li><span className="font-semibold text-foreground">AVL:</span> rotations keep left/right subtree heights within one; a stricter height balance than Red-Black.</li></ul>
          <p className="mt-3 text-xs text-muted-foreground">Animation snapshots and drawing add O(n) work per recorded step; these costs are separate from the underlying algorithms.</p>
        </Section>
      </aside>
    </main>
  );
}
