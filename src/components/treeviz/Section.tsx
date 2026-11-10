import type { ReactNode } from "react";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-4">
      <h3 className="mb-3 border-b pb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export interface Notify { ok: (m: string) => void; fail: (m: string) => void; info: (m: string) => void }
