import type { ReactNode } from "react";

import SeaBackdrop from "@/components/SeaBackdrop";

/**
 * PageShell — wraps an inner page in the "Undertow" atmosphere. The homepage
 * keeps its full animated canvas; every other page renders this calmer
 * (but still immersive) deep-sea ground with readable content on top.
 */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <SeaBackdrop />
      {children}
    </div>
  );
}
