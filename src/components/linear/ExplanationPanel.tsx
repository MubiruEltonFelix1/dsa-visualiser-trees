import type { OpFrame } from "@/lib/linear";
import { Section } from "@/components/treeviz/Section";

export interface ExplanationPanelProps {
  title: string;
  frame: OpFrame<unknown> | null;
  code: string[];
  explain: string[];
  complexity: [string, string][];
  emptyNote: string;
  context?: Record<string, string | number | null>;
}

export function ExplanationPanel({
  title,
  frame,
  code,
  explain,
  complexity,
  emptyNote,
  context,
}: ExplanationPanelProps) {
  return (
    <Section title={title}>
      <h2 className="text-lg font-semibold">{frame?.title ?? "Waiting for an operation"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{frame?.note ?? emptyNote}</p>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        {explain.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ol>
      <pre className="mt-4 overflow-x-auto rounded-lg border bg-background p-3 font-mono text-xs leading-6">
        {code.map((l, i) => (
          <div
            key={i}
            className={`rounded px-2 transition-colors ${frame && frame.line === i ? "bg-primary/20 text-primary" : ""}`}
          >
            {l}
          </div>
        ))}
      </pre>
      {context && (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {Object.entries(context).map(([key, value]) => (
            <div key={key}>
              <dt className="text-muted-foreground capitalize">{key}</dt>
              <dd className="font-mono">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {complexity.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-secondary px-3 py-2">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="font-mono">{v}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
