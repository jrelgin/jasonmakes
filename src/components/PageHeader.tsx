import type { ReactNode } from "react";

import DriftingWave from "@/components/DriftingWave";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
};

/**
 * PageHeader — the shared masthead for inner pages: an italic serif eyebrow,
 * a Gloock display title, an optional lede, and the drifting-wave flourish.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <header className="u-rise">
      {eyebrow ? <p className="u-eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="u-title text-5xl md:text-6xl lg:text-7xl">{title}</h1>
      {subtitle ? (
        <p className="u-lede mt-5 max-w-2xl text-xl md:text-2xl">{subtitle}</p>
      ) : null}
      <DriftingWave className="mt-8 max-w-[14rem]" />
    </header>
  );
}
