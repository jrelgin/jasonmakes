import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "#lib/utils/cn";

type IndexRowProps = {
  href: string;
  displayNumber: number;
  eyebrow: ReactNode;
  title: string;
  excerpt?: string;
  thumbnail?: { src: string };
  titleAs?: "h2" | "h3";
};

/**
 * IndexRow — a single row in a listing index. Articles and hobbies include a
 * thumbnail (and fold the running number into the eyebrow); case studies omit
 * the thumbnail and lead with the number instead.
 */
export default function IndexRow({
  href,
  displayNumber,
  eyebrow,
  title,
  excerpt,
  thumbnail,
  titleAs = "h3",
}: IndexRowProps) {
  const TitleTag = titleAs;
  const paddedNumber = String(displayNumber).padStart(2, "0");
  const showEyebrow = Boolean(thumbnail) || Boolean(eyebrow);

  return (
    <li>
      <Link
        href={href}
        className={cn("index-row group", thumbnail && "index-row--thumb")}
        prefetch
      >
        {thumbnail ? (
          <span className="index-row__thumb">
            <Image
              src={thumbnail.src}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="index-row__index">{paddedNumber}</span>
        )}
        <div>
          {showEyebrow && (
            <p className="u-eyebrow text-base">
              {thumbnail && (
                <span className="index-row__index">{paddedNumber}</span>
              )}
              {eyebrow}
            </p>
          )}
          <TitleTag className="index-row__title mt-1">{title}</TitleTag>
          {excerpt && <p className="index-row__excerpt">{excerpt}</p>}
        </div>
        <span aria-hidden="true" className="index-row__arrow">
          →
        </span>
      </Link>
    </li>
  );
}
