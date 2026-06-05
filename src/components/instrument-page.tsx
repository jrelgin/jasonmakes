import type { ReactNode } from "react";

import { cn } from "#lib/utils/cn";

type InstrumentPageProps = {
  children: ReactNode;
  className?: string;
  width?: "reading" | "standard" | "wide";
};

export function InstrumentPage({
  children,
  className,
  width = "standard",
}: InstrumentPageProps) {
  return (
    <main className={cn("instrument-page", className)}>
      <div className={cn("instrument-frame", `instrument-frame--${width}`)}>
        {children}
      </div>
    </main>
  );
}

type InstrumentHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  readout?: string;
  children?: ReactNode;
  className?: string;
};

export function InstrumentHeader({
  eyebrow,
  title,
  description,
  readout,
  children,
  className,
}: InstrumentHeaderProps) {
  return (
    <header className={cn("instrument-header", className)}>
      <div className="instrument-header__rail">
        <p>{eyebrow}</p>
        {readout && <span>{readout}</span>}
      </div>
      <div className="instrument-header__body">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
    </header>
  );
}

export function InstrumentMeta({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  const visibleItems = items.filter((item) => Boolean(item.value));

  if (visibleItems.length === 0) return null;

  return (
    <dl className="instrument-meta">
      {visibleItems.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
