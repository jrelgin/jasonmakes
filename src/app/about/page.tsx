import AboutBlurb from "@/app/components/AboutBlurb";
import FeedlyArticlesWidget from "@/app/components/FeedlyArticlesWidget";
import SpotifyWidget from "@/app/components/SpotifyWidget";
import WeatherWidget from "@/app/components/WeatherWidget";
import { PageIntro, SitePage } from "@/components/site-page";

export const metadata = {
  title: "About | Jason Makes",
  description:
    "About Jason Elgin, product leader and designer building tools for education, analytics, and creative work.",
};

export default function AboutPage() {
  return (
    <SitePage width="wide" className="about-page">
      <section className="about-hero">
        <PageIntro
          eyebrow="About"
          title="Jason Elgin turns messy product systems into useful, memorable software."
          description="Head of Product at Standard Education. Previously product design and strategy through Signal Lantern and FullStory."
        />

        <div className="about-bio-panel">
          <p>
            My work sits where product strategy, UX systems, analytics, and
            creative engineering overlap. I have led design and product work for
            education tools, research platforms, collaboration workflows, and
            internal systems that needed clearer structure before they could
            scale.
          </p>
          <p>
            I still care about the older fundamentals that got me into this
            work: well written code, beautiful design, and typography that
            carries its weight.
          </p>
        </div>

        <div className="about-signal-panel">
          <AboutBlurb />
        </div>
      </section>

      <section className="daily-profile">
        <div className="daily-profile__heading">
          <p className="page-eyebrow">Daily profile</p>
          <h2>Live signals, lightly framed.</h2>
        </div>

        <div className="profile-widget-grid">
          <div>
            <WeatherWidget />
          </div>

          <div>
            <SpotifyWidget />
          </div>
        </div>

        <div className="profile-reading">
          <FeedlyArticlesWidget />
        </div>
      </section>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} Jason Makes</p>
      </footer>
    </SitePage>
  );
}
