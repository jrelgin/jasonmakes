import type { ReactNode } from "react";

/**
 * React implementations for the custom Markdoc tags/nodes declared in
 * `./config.ts`. The map keys must match the `render` strings there.
 */

export function Callout({
  tone = "info",
  children,
}: {
  tone?: string;
  children?: ReactNode;
}) {
  return (
    <aside className={`ink-callout ink-callout--${tone}`} data-tone={tone}>
      {children}
    </aside>
  );
}

export function YouTube({ id, title }: { id: string; title?: string }) {
  // Accept a bare 11-char ID or a full URL and extract the ID.
  const videoId = /^[\w-]{11}$/.test(id)
    ? id
    : id.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] ?? id;

  return (
    <div className="ink-embed">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title ?? "YouTube video"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function ImageWithCaption({
  src,
  alt = "",
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="ink-figure">
      {/* Content images have unknown intrinsic dimensions, so a plain lazy
          <img> (styled by .ink-prose) is more robust than next/image here. */}
      <img src={src} alt={alt} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function Link({
  href = "",
  title,
  children,
}: {
  href?: string;
  title?: string;
  children?: ReactNode;
}) {
  const external = /^(https?:)?\/\//i.test(href) || /^mailto:/i.test(href);
  return (
    <a
      href={href}
      title={title}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export const markdocComponents = {
  Callout,
  YouTube,
  ImageWithCaption,
  Link,
};
