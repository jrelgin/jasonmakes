import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";
import DriftingWave from "@/components/DriftingWave";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
};

// The KV-backed Daily Profile widgets below are the only live data on this
// page. Revalidate hourly so they stay fresh even between cron runs; the cron
// job also calls revalidatePath('/about') right after each profile update.
export const revalidate = 3600;

const principles = [
  {
    title: "Mission first",
    body: "Designing for educators and students keeps the work grounded and consequential.",
  },
  {
    title: "Simple scales",
    body: "Clear systems outlast clever ones — especially as a product moves from service to software.",
  },
  {
    title: "Respect attention",
    body: "Organize complexity instead of hiding it, so people can choose with confidence.",
  },
];

const elsewhere = [
  { label: "GitHub", href: "https://github.com/jrelgin" },
  { label: "Email", href: "mailto:jason@signallantern.com" },
  { label: "Signal Lantern", href: "https://signallantern.com" },
  { label: "FullStory", href: "https://fullstory.com" },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="read-veil">
          <div className="u-rise max-w-3xl">
            <p className="u-eyebrow text-lg">Product builder</p>
            <h1 className="u-title mt-3 text-5xl md:text-6xl lg:text-7xl">
              Jason Elgin
            </h1>
            <p className="u-lede mt-5 text-2xl">
              Head of Product at Standard Education, after fifteen years of
              turning messy problems into software that works.
            </p>
            <DriftingWave className="mt-8 max-w-[16rem]" />
          </div>

          <div className="u-rise u-rise-1 mt-10 max-w-2xl space-y-6 text-lg leading-relaxed text-[var(--u-ink)]">
            <p>
              I've spent fifteen years making things, and for most of that time
              the making was the hard part. It isn't anymore. What's hard now,
              and what I find myself caring about most, is knowing what's worth
              making, getting it in front of real people fast, and being honest
              about whether it actually helped.
            </p>
            <p>
              Today I'm Head of Product at Standard Education, where we turn
              K–12 analytics into tools that help educators reach students
              before they fall behind. Before that I led design for product-led
              growth and collaboration at{" "}
              <a
                href="https://fullstory.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--u-accent)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--u-accent-strong)]"
              >
                FullStory
              </a>
              , rebuilt the survey-export experience at Glass for research teams
              at brands like Unilever and Clorox, and shaped product strategy at{" "}
              <a
                href="https://signallantern.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--u-accent)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--u-accent-strong)]"
              >
                Signal Lantern
              </a>
              .
            </p>
            <p>
              The craft underneath still matters to me. Heuristic evaluation,
              information architecture, design systems, the quiet scaffolding
              that makes the next decision easier. It's what lets me move fast
              on the right things instead of just fast. Good work doesn't erase
              complexity so much as organize it, so the people I build for can
              make confident choices, and so I can see whether the choice was
              right.
            </p>
            <p className="font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--u-ink-strong)]">
              This site is a small experiment in that idea: a calm surface over
              a lot of moving water.
            </p>
          </div>

          <ul className="u-rise u-rise-1 mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <li key={principle.title} className="frost-panel p-5">
                <p className="u-eyebrow text-base">{principle.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--u-ink-muted)]">
                  {principle.body}
                </p>
              </li>
            ))}
          </ul>

          <ul className="u-rise u-rise-2 mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider">
            {elsewhere.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--u-ink-muted)] transition-colors hover:text-[var(--u-accent)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="u-rise u-rise-2 mt-12">
            <AboutBlurb />
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 pb-16">
        <div className="read-veil">
          <p className="u-eyebrow text-lg">Right now</p>
          <h2 className="u-title mt-2 text-4xl md:text-5xl">Daily Profile</h2>
          <p className="u-lede mt-3 max-w-xl text-lg">
            A small, automatically-updating snapshot — the weather over Atlanta,
            what I've been listening to, and what I've been reading.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <WeatherWidget />
            <SpotifyWidget />
          </div>

          <div className="mt-6">
            <FeedlyArticlesWidget />
          </div>
        </div>
      </section>

      <footer className="container mx-auto max-w-4xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--u-ink-muted)]">
          © {new Date().getFullYear()} Jason Elgin
        </p>
      </footer>
    </PageShell>
  );
}
