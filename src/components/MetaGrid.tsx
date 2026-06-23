type MetaGridItem = {
  label: string;
  value: string;
};

type MetaGridProps = {
  items: MetaGridItem[];
};

/**
 * MetaGrid — the frosted definition-list panel used to summarize a piece of
 * work (role/scope/industry, or type/status/built-with) on detail pages.
 */
export default function MetaGrid({ items }: MetaGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <dl className="frost-panel mt-8 grid gap-5 p-6 text-sm sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="u-eyebrow text-sm">{item.label}</dt>
          <dd className="mt-1.5 text-[var(--u-ink-strong)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
