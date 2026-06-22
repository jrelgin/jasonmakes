import { SITE_URL } from "../config/site";

function absolute(pathOrUrl: string): string {
  return pathOrUrl.startsWith("http") ? pathOrUrl : `${SITE_URL}${pathOrUrl}`;
}

/** BlogPosting / Article structured data for a content detail page. */
export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  datePublished: string;
  authorName: string;
  type?: "BlogPosting" | "Article";
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "BlogPosting",
    headline: input.title,
    description: input.description,
    url: absolute(input.path),
    mainEntityOfPage: absolute(input.path),
    ...(input.image ? { image: absolute(input.image) } : {}),
    datePublished: input.datePublished,
    author: { "@type": "Person", name: input.authorName },
  };
}

/** Site-wide WebSite + Person structured data for the root layout. */
export function siteJsonLd(input: {
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  sameAs: string[];
}): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: input.siteTitle,
      url: SITE_URL,
      description: input.siteDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: input.authorName,
      url: SITE_URL,
      ...(input.sameAs.length > 0 ? { sameAs: input.sameAs } : {}),
    },
  ];
}
