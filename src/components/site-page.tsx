import type { ReactNode } from "react";

import { cn } from "#lib/utils/cn";

type SitePageProps = {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "standard" | "wide";
};

export function SitePage({
  children,
  className,
  width = "standard",
}: SitePageProps) {
  return (
    <main className={cn("site-page", className)}>
      <div className={cn("site-page__inner", `site-page__inner--${width}`)}>
        {children}
      </div>
    </main>
  );
}

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageIntroProps) {
  return (
    <header className={cn("page-intro", className)}>
      <p className="page-eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
      {children}
    </header>
  );
}

export function MetaRail({ children }: { children: ReactNode }) {
  return <div className="meta-rail">{children}</div>;
}

export function MetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="meta-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
