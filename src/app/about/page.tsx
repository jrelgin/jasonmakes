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
          readout="Product / systems / making"
          title="Jason Elgin builds calm paths through complicated software."
          description="Head of Product at Standard Education. Previously product design and strategy through Signal Lantern and FullStory."
        />

        <div className="about-instrument__grid">
          <div className="about-instrument__bio">
            <p>
              I work between product strategy, UX systems, analytics, and
              creative engineering. The pattern is usually the same: find the
              shape inside a messy tool, make the important paths visible, and
              give teams a system they can keep using after the first launch.
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
