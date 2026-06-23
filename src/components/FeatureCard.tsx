import Image from "next/image";
import Link from "next/link";

import KeyPointsList from "./KeyPointsList";

type FeatureCardProps = {
  href: string;
  image?: { src: string; alt: string };
  eyebrow?: string;
  title: string;
  excerpt?: string;
  points?: string[];
  cta: string;
};

/**
 * FeatureCard — the large frosted card that leads a listing page (the featured
 * case study or hobby project). The image column is optional; when absent the
 * body spans the full grid.
 */
export default function FeatureCard({
  href,
  image,
  eyebrow,
  title,
  excerpt,
  points,
  cta,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="frost-panel group block overflow-hidden"
      prefetch
    >
      <div className="grid md:grid-cols-5">
        {image && (
          <div className="relative aspect-[16/10] md:col-span-2 md:aspect-auto">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
        <div
          className={
            image ? "p-7 md:col-span-3 md:p-9" : "p-7 md:col-span-5 md:p-9"
          }
        >
          {eyebrow && <p className="u-eyebrow text-base">{eyebrow}</p>}
          <h2 className="u-title mt-2 text-3xl md:text-4xl">{title}</h2>
          {excerpt && (
            <p className="mt-3 leading-relaxed text-[var(--u-ink-muted)]">
              {excerpt}
            </p>
          )}
          {points && <KeyPointsList items={points} variant="compact" max={3} />}
          <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-[var(--u-accent)]">
            {cta}
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
