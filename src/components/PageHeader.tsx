import type { ReactNode } from "react";

import WaveRule from "@/components/WaveRule";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
};

/**
 * PageHeader — the shared masthead for inner pages: a mono eyebrow, an Apoc
 * display title, an optional lede, and a hairline wave rule. Animates in
 * gently on load (disabled under prefers-reduced-motion).
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <header className="tide-rise">
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1 className="page-title text-4xl md:text-5xl lg:text-6xl">{title}</h1>
      {subtitle ? (
        <p className="lede mt-4 max-w-2xl text-lg md:text-xl">{subtitle}</p>
      ) : null}
      <WaveRule className="mt-8 max-w-[11rem] opacity-80" />
    </header>
  );
}
