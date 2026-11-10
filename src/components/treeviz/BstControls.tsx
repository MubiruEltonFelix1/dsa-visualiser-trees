import { useState } from "react";
import { Hammer, Minus, Plus, Scale, Shuffle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BST_PRESETS, buildFrom, contains, insert, parseValues, randomValues, remove, type TreeNode } from "@/lib/bst";
import { Section, type Notify } from "./Section";

interface Props { root: TreeNode | null; setRoot: (r: TreeNode | null) => void; notify: Notify; onBalance: () => void }

export function BstControls({ root, setRoot, notify, onBalance }: Props) {
  const [list, setList] = useState("");
  const [ins, setIns] = useState("");
  const [del, setDel] = useState("");
  const [count, setCount] = useState("10");

  const build = (values: number[], label = "Built BST") => {
    const r = buildFrom(values);
    setRoot(r.root);
    notify.ok(`${label}: ${values.length - r.duplicates.length} nodes.`);
    if (r.duplicates.length) notify.info(`Ignored duplicate value(s): ${[...new Set(r.duplicates)].join(", ")}. A BST stores each value once.`);
  };
  const buildList = () => { const p = parseValues(list); if (p.error) return notify.fail(p.error); build(p.values); };
  const single = (s: string) => {
    const p = parseValues(s);
    if (p.error) { notify.fail(p.error); return null; }
    if (p.values.length !== 1) { notify.fail("Enter exactly one number."); return null; }
    return p.values[0] ?? null;
  };

  return (
    <>
      <Section title="Create BST">
        <div className="space-y-2">
          <Input value={list} onChange={(e) => setList(e.target.value)} placeholder="50, 30, 70, 20, 40, 60, 80" className="font-mono"
            onKeyDown={(e) => e.key === "Enter" && buildList()} />
          <Button className="w-full" title="Insert each value into a new BST, in order" onClick={buildList}>
            <Hammer /> Build Tree
          </Button>
          <div className="flex gap-2">
            <Input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className="w-20 font-mono" title="Number of nodes" />
            <Button variant="secondary" className="flex-1" title="Generate distinct random values"
              onClick={() => {
                const n = Number(count);
                if (!Number.isInteger(n) || n < 1) return notify.fail("Node count must be a positive whole number.");
                if (n > 2000) return notify.fail("Choose 2000 nodes or fewer for smooth browser performance.");
                build(randomValues(n), "Random BST");
              }}>
              <Shuffle /> Random BST
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="w-full text-xs text-muted-foreground">Examples (not size limits):</span>
            {BST_PRESETS.map((p) => (
              <Button key={p.label} size="sm" variant="outline" onClick={() => { const v = p.values(); setList(v.join(", ")); build(v, p.label); }}>{p.label}</Button>
            ))}
          </div>
        </div>
      </Section>
      <Section title="Modify BST">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input type="number" value={ins} onChange={(e) => setIns(e.target.value)} placeholder="Value" className="font-mono" />
            <Button title="Insert a single value" onClick={() => {
              const v = single(ins); if (v === null) return;
              if (contains(root, v)) return notify.fail(`${v} already exists — duplicates are ignored in a BST.`);
              setRoot(insert(root, v)); setIns(""); notify.ok(`Inserted ${v}.`);
            }}><Plus /> Insert</Button>
          </div>
          <div className="flex gap-2">
            <Input type="number" value={del} onChange={(e) => setDel(e.target.value)} placeholder="Value" className="font-mono" />
            <Button variant="secondary" disabled={!root} title="Remove a value (handles 0, 1 or 2 children)" onClick={() => {
              const v = single(del); if (v === null) return;
              if (!contains(root, v)) return notify.fail(`${v} is not in the tree.`);
              setRoot(remove(root, v)); setDel(""); notify.ok(`Deleted ${v}.`);
            }}><Minus /> Delete</Button>
          </div>
          <Button variant="secondary" className="w-full" disabled={!root} onClick={onBalance} title="Balance with real AVL rotations, shown step by step in the Balancing Lab"><Scale /> Balance This BST</Button>
          <Button variant="destructive" className="w-full" disabled={!root} onClick={() => { setRoot(null); notify.ok("BST cleared."); }}><Trash2 /> Clear Tree</Button>
          <p className="text-xs text-muted-foreground">
            Smaller values go left, larger go right; duplicates are ignored. This is an ordinary BST — it never rebalances, so sorted input makes it lopsided.
          </p>
        </div>
      </Section>
    </>
  );
}
