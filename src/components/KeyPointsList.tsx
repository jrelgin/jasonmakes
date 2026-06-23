import { cn } from "#lib/utils/cn";

type KeyPointsListProps = {
  items: string[];
  variant?: "detail" | "compact";
  max?: number;
  className?: string;
};

/**
 * KeyPointsList — the accent-bordered list used for case-study outcomes and
 * hobby highlights. The `detail` variant is a two-column grid with a thicker
 * rule; the `compact` variant is a tighter stack used inside FeatureCard.
 */
export default function KeyPointsList({
  items,
  variant = "detail",
  max,
  className,
}: KeyPointsListProps) {
  const points = typeof max === "number" ? items.slice(0, max) : items;

  if (points.length === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <ul
        className={cn("mt-5 space-y-2 text-sm text-[var(--u-ink)]", className)}
      >
        {points.map((point) => (
          <li key={point} className="border-l border-[var(--u-accent)] pl-3">
            {point}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("mt-6 grid gap-3 md:grid-cols-2", className)}>
      {points.map((point) => (
        <li
          key={point}
          className="border-l-2 border-[var(--u-accent)] pl-4 text-sm leading-relaxed text-[var(--u-ink)]"
        >
          {point}
        </li>
      ))}
    </ul>
  );
}
