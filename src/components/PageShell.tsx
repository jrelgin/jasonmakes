import type { ReactNode } from "react";

/**
 * PageShell — wraps an inner page in the themed seascape ground.
 *
 * The homepage keeps its full animated canvas; every other page renders this
 * calmer, readable ground instead. The background is a fixed, full-bleed layer
 * so the paper/deep-sea color sits behind the floating nav with no seam.
 */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <div className="page-shell__bg" aria-hidden="true" />
      {children}
    </div>
  );
}
