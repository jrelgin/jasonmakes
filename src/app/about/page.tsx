import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";
import Disclosure from "@/components/Disclosure";
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
              Head of Product at Standard Education. Over 15 years of turning
              messy problems into software that works.
            </p>
            <DriftingWave className="mt-8 max-w-[16rem]" />
          </div>

          <div className="u-rise u-rise-1 mt-10 max-w-2xl space-y-6 text-lg leading-relaxed text-[var(--u-ink)]">
            <p>
              For most of that time, the making was the hard part. It isn't
              anymore. What's hard now, and what I find myself caring about
              most, is knowing what's worth making, getting it in front of real
              people fast, and being honest about whether it actually helped.
            </p>
            <p>
              The craft underneath still matters to me: heuristic evaluation,
              information architecture, design systems, the quiet scaffolding
              that makes the next decision easier. Good work doesn't erase
              complexity so much as organize it, so the people I build for can
              make confident choices.
            </p>
            <p>
              That's the work at Standard Education, where we turn K-12
              analytics into tools that help educators reach students before
              they fall behind. Before that, I led design for product-led growth
              and collaboration at{" "}
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
            <p className="font-[family-name:var(--font-instrument-serif)] text-xl italic text-[var(--u-ink-strong)]">
              This site is a small experiment in that idea: a calm surface over
              a lot of moving water.
            </p>
          </div>

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

          <h2 className="u-title mt-16 text-4xl md:text-5xl">Right now</h2>

          <div className="u-rise u-rise-1 mt-8">
            <AboutBlurb />
          </div>

          <Disclosure
            className="u-rise u-rise-1 mt-3"
            label="Wait, what is this?"
            align="right"
          >
            <p>
              This part runs on its own. The weather over Atlanta, the last
              track I played, and what I'm reading all update through the day.
              The short dispatch up top is written each morning by AI from those
              same signals, which is why it talks about me in the third person.
              It's the moving water from the line above, made literal.
            </p>
          </Disclosure>

          <div className="u-rise u-rise-2 mt-8 grid gap-6 md:grid-cols-2">
            <WeatherWidget />
            <SpotifyWidget />
          </div>

          <div className="u-rise u-rise-2 mt-6">
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
