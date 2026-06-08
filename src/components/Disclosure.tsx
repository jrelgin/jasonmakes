"use client";

import { type ReactNode, useId, useState } from "react";

/**
 * Disclosure: a calm inline expand/collapse. The trigger reads as an accent
 * link rather than a chrome button; the panel animates to its natural height
 * via a grid-template-rows transition (no magic max-height) and respects
 * prefers-reduced-motion. Content stays mounted so the close animation can run
 * and aria-controls always resolves.
 */
export default function Disclosure({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 font-[family-name:var(--font-instrument-serif)] text-lg italic text-[var(--u-accent)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--u-accent-strong)]"
      >
        {label}
        <span
          aria-hidden="true"
          className={`inline-block transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </button>

      <div
        id={regionId}
        role="region"
        aria-label={label}
        data-open={open}
        className="disclosure-region"
      >
        <div className="disclosure-region__inner">
          <div className="mt-3 max-w-2xl text-lg leading-relaxed text-[var(--u-ink-muted)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
