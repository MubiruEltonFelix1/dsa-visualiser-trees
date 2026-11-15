import { Layers, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ArrayVisualizerProps {
  items: number[] | null;
  kind: "stack" | "queue";
  focus: number | null;
  path: number[];
}

export function ArrayVisualizer({ items, kind, focus, path }: ArrayVisualizerProps) {
  const list = items ?? [];
  const count = list.length;
  const isStack = kind === "stack";
  const last = count - 1;

  if (count === 0) {
    return (
      <div className="array-stage canvas-grid min-h-[300px] w-full overflow-hidden rounded-lg border flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-6 text-center text-muted-foreground">
          <div className="rounded-full border bg-card p-4 text-primary">
            {isStack ? <Layers className="size-8" /> : <ListOrdered className="size-8" />}
          </div>
          <h2 className="text-xl font-semibold">{isStack ? "Stack" : "Queue"} is empty</h2>
          <p className="mt-1 max-w-xs text-sm">
            {isStack ? "Push values to build the stack." : "Enqueue values to build the queue."}
          </p>
        </div>
      </div>
    );
  }

  const cell = (value: number, i: number) => {
    const isFocus = i === focus;
    const isPath = path.includes(i);
    const base =
      "relative min-w-[44px] h-10 rounded-md border border-border p-2 font-mono text-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-300";
    const extra = isFocus
      ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_,50%_transparent)]"
      : "";
    const involved = isPath ? "border-selected bg-selected/10" : "";
    const tag = isStack
      ? i === last
        ? "TOP"
        : null
      : i === 0
        ? "FRONT"
        : i === last
          ? "REAR"
          : null;
    return (
      <div key={i} className={base + " " + extra + " " + involved}>
        <span className="text-[10px] text-muted-foreground">{i}</span>
        <span className="font-mono font-semibold">{value}</span>
        {tag && (
          <span className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
            <Badge variant={isStack ? "default" : "secondary"} className="text-[10px] px-2 py-0.5">
              {tag}
            </Badge>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="array-stage canvas-grid min-h-[300px] w-full overflow-hidden rounded-lg border flex items-center justify-center p-4">
      <div className={`flex gap-1.5 ${isStack ? "flex-col items-center" : "items-end"}`}>
        {list.map((value, i) => cell(value, i))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {isStack
          ? "Bottom → Top (last element is the top)"
          : "Front → Rear (first element is the front)"}
      </div>
    </div>
  );
}
