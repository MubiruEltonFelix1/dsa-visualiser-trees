import { useEffect, useMemo, useState } from "react";
import { Braces, Pencil, Plus, Sprout, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addChild, findNode, fromJson, GENERAL_PRESETS, listNodes, makeG, removeSubtree, rename, toJson, validateLabel, validateStructure, type GNode,
} from "@/lib/general";
import { Section, type Notify } from "./Section";

interface Props {
  root: GNode | null;
  setRoot: (r: GNode | null) => void;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  notify: Notify;
}

export function GeneralControls({ root, setRoot, selectedId, setSelectedId, notify }: Props) {
  const [label, setLabel] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [json, setJson] = useState("");
  const all = useMemo(() => listNodes(root), [root]);
  const selected = selectedId != null ? findNode(root, selectedId) : null;
  useEffect(() => { setRenameTo(selected?.label ?? ""); }, [selected?.id, selected?.label]);

  const commit = (r: GNode | null, msg: string) => {
    const v = validateStructure(r);
    if (!v.ok) return notify.fail(v.error!);
    setRoot(r); notify.ok(msg);
  };
  const lbl = (raw: string) => { const v = validateLabel(raw); if (v.error) notify.fail(v.error); return v.label ?? null; };

  const createRoot = () => {
    if (root) return notify.fail("The tree already has a root. A tree can only have one root — add children instead.");
    const l = lbl(label); if (!l) return;
    const r = makeG(l); commit(r, `Created root ${l}.`); setSelectedId(r.id); setLabel("");
  };
  const addKid = () => {
    if (!root) return notify.fail("Create a root node first.");
    if (!selected) return notify.fail("Select a parent node first (click it on the canvas or pick it below).");
    const l = lbl(label); if (!l) return;
    const r = addChild(root, selected.id, l);
    commit(r.root, `Added ${l} as a child of ${selected.label}.`); setLabel("");
  };

  return (
    <>
      <Section title="Node editor">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="parent">Selected / parent node</label>
            <select id="parent" value={selectedId ?? ""} disabled={!root}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="h-9 w-full rounded-md border bg-background px-2 font-mono text-sm disabled:opacity-50">
              <option value="">{root ? "— none selected —" : "— tree is empty —"}</option>
              {all.map((n) => <option key={n.id} value={n.id}>{"\u00a0\u00a0".repeat(n.depth)}{n.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="New node label" className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && (root ? addKid() : createRoot())} />
            {root ? (
              <Button onClick={addKid} disabled={!selected} title="Add a child under the selected node"><Plus /> Add child</Button>
            ) : (
              <Button onClick={createRoot} title="Create the root node"><Sprout /> Create root</Button>
            )}
          </div>
          {selected ? (
            <div className="space-y-2 rounded-lg border border-selected/40 bg-selected/5 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Selected: <span className="font-mono font-semibold text-selected">{selected.label}</span>
                  <span className="text-muted-foreground"> · {selected.children.length} child{selected.children.length === 1 ? "" : "ren"}</span></span>
                <Button size="icon" variant="ghost" className="size-7" title="Deselect" onClick={() => setSelectedId(null)}><X /></Button>
              </div>
              <div className="flex gap-2">
                <Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} className="font-mono" placeholder="New label" />
                <Button variant="secondary" title="Rename the selected node" onClick={() => {
                  const l = lbl(renameTo); if (!l || !root) return;
                  commit(rename(root, selected.id, l), `Renamed ${selected.label} to ${l}.`);
                }}><Pencil /> Rename</Button>
              </div>
              <Button variant="destructive" size="sm" className="w-full" title="Delete this node and all its descendants" onClick={() => {
                const isRoot = selected.id === root?.id;
                commit(removeSubtree(root, selected.id), isRoot ? "Root deleted — the tree is now empty. Create a new root." : `Deleted ${selected.label} and its subtree.`);
                setSelectedId(null);
              }}><Trash2 /> Delete node & subtree</Button>
            </div>
          ) : root ? <p className="text-xs text-muted-foreground">Click a node on the canvas to select it, rename it, or add children.</p> : null}
          <Button variant="outline" className="w-full" disabled={!root} onClick={() => { setRoot(null); setSelectedId(null); notify.ok("General tree cleared."); }}><Trash2 /> Clear Tree</Button>
          <p className="text-xs text-muted-foreground">Nodes may have any number of children. Labels don't need to be unique — every node has its own hidden ID.</p>
        </div>
      </Section>
      <Section title="Examples & JSON">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {GENERAL_PRESETS.map((p) => (
              <Button key={p.label} size="sm" variant="outline" onClick={() => { const r = p.build(); commit(r, `Loaded ${p.label}.`); setSelectedId(null); setJson(toJson(r)); }}>{p.label}</Button>
            ))}
          </div>
          <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={5} className="font-mono text-xs"
            placeholder={'{"label": "A", "children": [{"label": "B"}, {"label": "C"}]}'} />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => {
              const r = fromJson(json);
              if (r.error) return notify.fail(r.error);
              commit(r.root!, "Built tree from JSON."); setSelectedId(null);
            }}><Braces /> Build from JSON</Button>
            <Button size="sm" variant="secondary" disabled={!root} onClick={() => setJson(toJson(root))}>Export current</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
