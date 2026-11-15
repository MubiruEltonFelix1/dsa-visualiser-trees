import { CheckCircle2, CircleHelp, ShieldCheck, XCircle } from "lucide-react";
import type { Invariant } from "@/lib/invariants";
import { Section } from "./Section";

export function Invariants({ checks, label = "tree" }: { checks: Invariant[]; label?: string }) {
  const satisfied = checks.filter((c) => c.status === "Satisfied").length;
  const violated = checks.filter((c) => c.status === "Violated").length;
  return (
    <Section title="Invariants">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <ShieldCheck
          className={`size-4 shrink-0 ${violated ? "text-destructive" : "text-primary"}`}
        />
        <span>
          {satisfied} of {checks.length} invariants satisfied
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Currently shown {label}
        {violated
          ? " · Violations may occur during a repair."
          : satisfied
            ? ""
            : ` · Empty ${label}: not checked.`}
      </p>
      <div className="space-y-3">
        {(["Shared structure", "Tree-specific"] as const).map((scope) => {
          const group = checks.filter((c) => c.scope === scope);
          return (
            group.length > 0 && (
              <div key={scope}>
                <h4 className="mb-1 text-xs font-medium text-muted-foreground">{scope}</h4>
                <ul className="divide-y divide-border">
                  {group.map((c) => (
                    <li key={c.name} className="py-2.5">
                      <div className="flex items-start gap-2">
                        {c.status === "Satisfied" ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        ) : c.status === "Violated" ? (
                          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                        ) : (
                          <CircleHelp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                            <h5 className="text-sm font-medium">{c.name}</h5>
                            <span
                              className={`text-xs ${c.status === "Violated" ? "text-destructive" : c.status === "Satisfied" ? "text-success" : "text-muted-foreground"}`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {c.explanation}
                          </p>
                          {c.violation && (
                            <p className="mt-1 text-xs leading-relaxed text-destructive">
                              {c.violation}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          );
        })}
      </div>
    </Section>
  );
}

export const violationIds = (checks: Invariant[]) =>
  new Set(checks.filter((c) => c.status === "Violated").flatMap((c) => c.nodeIds));
