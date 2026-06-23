import DriftingWave from "@/components/DriftingWave";
import PageShell from "@/components/PageShell";
import MarkdocContent from "@/components/markdoc/MarkdocContent";
import { buildListingMetadata } from "../../../lib/config/site";
import { getAboutContent, getSiteSettings } from "../../../lib/data/settings";

export const metadata = buildListingMetadata({
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
  path: "/about",
});

export default async function AboutPage() {
  const [about, settings] = await Promise.all([
    getAboutContent(),
    getSiteSettings(),
  ]);

  return (
    <PageShell>
      <section className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <div className="u-rise max-w-3xl">
            <p className="u-eyebrow text-lg">Product builder</p>
            <h1 className="u-title mt-3 text-5xl md:text-6xl lg:text-7xl">
              {settings.authorName}
            </h1>
            <p className="u-lede mt-5 text-2xl">{about.lede}</p>
            <DriftingWave className="mt-8" />
          </div>

          {about.body && (
            <div className="ink-prose u-rise u-rise-1 mt-10 max-w-2xl">
              <MarkdocContent content={about.body} />
            </div>
          )}

          {settings.socialLinks.length > 0 && (
            <ul className="u-rise u-rise-2 mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider">
              {settings.socialLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--u-ink-muted)] transition-colors hover:text-[var(--u-accent)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="container mx-auto max-w-4xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--u-ink-muted)]">
          © {new Date().getFullYear()} {settings.authorName}
        </p>
      </footer>
    </PageShell>
  );
}
