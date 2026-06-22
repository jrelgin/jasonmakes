import { SITE_URL } from "../../../lib/config/site";
import { listArticles } from "../../../lib/data/content";
import { getSiteSettings } from "../../../lib/data/settings";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [articles, settings] = await Promise.all([
    listArticles(),
    getSiteSettings(),
  ]);

  const items = articles
    .map((article) => {
      const url = `${SITE_URL}/articles/${article.slug}`;
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(article.publishDate).toUTCString()}</pubDate>
      <description>${escapeXml(article.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.siteTitle)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(settings.siteDescription)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
