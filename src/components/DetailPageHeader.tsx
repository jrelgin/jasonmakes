import type { ReactNode } from "react";

import { cn } from "#lib/utils/cn";

import BackLink from "./BackLink";
import DriftingWave from "./DriftingWave";

type DetailPageHeaderProps = {
  backHref: string;
  backLabel: string;
  eyebrow?: ReactNode;
  title: string;
  children?: ReactNode;
};

/**
 * DetailPageHeader — the shared masthead for article, case-study, and hobby
 * detail pages: a back link, an optional monospace meta label above the Gloock
 * title, and the drifting-wave flourish. `children` holds any per-section
 * extras (action buttons, MetaGrid, KeyPointsList).
 */
export default function DetailPageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  children,
}: DetailPageHeaderProps) {
  return (
    <header className="u-rise">
      <BackLink href={backHref} label={backLabel} />
      {eyebrow ? (
        <p className="mt-5 font-mono text-sm uppercase tracking-wider text-[var(--u-ink-muted)]">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "u-title text-4xl md:text-5xl lg:text-6xl",
          eyebrow ? "mt-2" : "mt-5",
        )}
      >
        {title}
      </h1>
      <DriftingWave className="mt-8" />
      {children}
    </header>
  );
}
