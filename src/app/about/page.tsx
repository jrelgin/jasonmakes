import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";
import { InstrumentHeader, InstrumentPage } from "@/components/instrument-page";

export const metadata = {
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
};

export default function AboutPage() {
  return (
    <InstrumentPage width="wide" className="about-instrument-page">
      <section className="about-instrument">
        <InstrumentHeader
          eyebrow="About"
          readout="Field notes / product signals / soft machines"
          title="Jason Elgin keeps a lantern lit at the edge of complicated software."
          description="Head of Product at Standard Education, founder of Signal Lantern, and former product/design partner to FullStory teams."
        />

        <div className="about-instrument__grid">
          <div className="about-instrument__bio">
            <p>
              Most of my work starts in the room where the map has stopped
              matching the terrain. Someone has a tool with too much gravity: a
              school system full of hidden operational weight, an analytics
              product where a useful behavior has not become a habit yet, or a
              young company that can feel the friction but cannot quite name it.
              I like that room.
            </p>
            <p>
              Standard Education is the heavy machine: policy, data, educators,
              dashboards, and the problem of making the next district easier to
              serve than the last one. FullStory is the signal chamber: watching
              behavior, finding the collaborative spark, and shaping product
              loops that make insight travel. Signal Lantern is the practice
              around both: interviews, usage data, onboarding, feature
              discovery, and enough design taste to make the system feel alive.
            </p>
            <p>
              The older thread is still there too: clean code, beautiful design,
              and a persistent interest in typography.
            </p>
          </div>

          <div className="about-instrument__signal">
            <p className="instrument-label">Current signal</p>
            <AboutBlurb />
          </div>
        </div>
      </section>

      <section className="signal-section">
        <div className="signal-section__heading">
          <p className="instrument-label">Daily profile</p>
          <h2>Small live readouts.</h2>
        </div>

        <div className="signal-grid">
          <div>
            <WeatherWidget />
          </div>

          <div>
            <SpotifyWidget />
          </div>
        </div>

        <FeedlyArticlesWidget />
      </section>

      <footer className="instrument-footer">
        <p>&copy; {new Date().getFullYear()} Jason Makes</p>
      </footer>
    </InstrumentPage>
  );
}
