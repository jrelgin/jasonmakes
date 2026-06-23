import type { ReactNode } from "react";

type EmptyStateProps = {
  children: ReactNode;
};

/**
 * EmptyState — the shared "nothing here yet" message rendered as a lede when a
 * listing page has no entries.
 */
export default function EmptyState({ children }: EmptyStateProps) {
  return <p className="u-lede mt-16 text-xl">{children}</p>;
}
