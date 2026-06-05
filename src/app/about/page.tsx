import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";
import PageShell from "@/components/PageShell";
import WaveRule from "@/components/WaveRule";

export const metadata = {
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
};

const elsewhere = [
  { label: "GitHub", href: "https://github.com/jrelgin" },
  { label: "Email", href: "mailto:jason@signallantern.com" },
  { label: "Signal Lantern", href: "https://signallantern.com" },
  { label: "FullStory", href: "https://fullstory.com" },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="container mx-auto px-4 py-14 md:py-20">
        <div className="tide-rise max-w-3xl">
          <p className="eyebrow mb-3">Product builder</p>
          <h1 className="page-title text-4xl md:text-5xl lg:text-6xl">
            Jason Elgin
          </h1>
          <p className="lede mt-4 text-xl md:text-2xl">
            Head of Product at Standard Education, after fifteen years of
            turning messy problems into software that works.
          </p>

          <WaveRule className="mt-8 max-w-[11rem] opacity-80" />

          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-[var(--ink)]">
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
                className="text-[var(--accent)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent-strong)]"
              >
                FullStory
              </a>
              , rebuilt the survey-export experience at Glass for research teams
              at brands like Unilever and Clorox, and shaped product strategy at{" "}
              <a
                href="https://signallantern.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent-strong)]"
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
            <p className="text-xl italic text-[var(--ink-strong)]">
              This site is a small experiment in that idea: a calm surface over
              a lot of moving water.
            </p>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider">
            {elsewhere.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ink-muted)] transition-colors hover:text-[var(--accent)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="tide-rise tide-rise-1 mt-10 max-w-3xl">
          <AboutBlurb />
        </div>
      </section>

      <section className="border-t border-[var(--hairline)]">
        <div className="container mx-auto px-4 py-14 md:py-16">
          <p className="eyebrow mb-2">Right now</p>
          <h2 className="font-heading text-3xl text-[var(--ink-strong)] md:text-4xl">
            Daily Profile
          </h2>
          <p className="lede mt-2 max-w-xl">
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

      <footer className="container mx-auto px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          © {new Date().getFullYear()} Jason Elgin
        </p>
      </footer>
    </PageShell>
  );
}
