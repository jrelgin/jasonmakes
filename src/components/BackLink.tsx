import Link from "next/link";

type BackLinkProps = {
  href: string;
  label: string;
};

/**
 * BackLink — the shared "← Section" breadcrumb that sits at the top of every
 * detail page header. Styled as an italic serif eyebrow.
 */
export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="u-eyebrow inline-flex items-center gap-2 transition-opacity hover:opacity-70"
    >
      <span aria-hidden="true">←</span> {label}
    </Link>
  );
}
