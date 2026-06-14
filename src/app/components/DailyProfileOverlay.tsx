import { formatUpdatedAt } from "@/lib/date";
import { kv } from "#lib/kv";
import type { Profile } from "#lib/profile";
import type { ReadingArticle } from "#lib/providers/readwise";
import type { SpotifyTrack } from "#lib/providers/spotify";
import type { Weather } from "#lib/providers/weather";

import DailyProfilePanel from "./DailyProfilePanel";

const BLURB_FALLBACK =
  "Jason is somewhere near the surface today, making sense of what is moving around him.";

async function readBlurb(): Promise<string> {
  try {
    return (await kv.get<string>("blurb")) ?? BLURB_FALLBACK;
  } catch (error) {
    console.error("Failed to fetch blurb from KV:", error);
    return BLURB_FALLBACK;
  }
}

async function readProfile(): Promise<Profile | null> {
  try {
    return await kv.get<Profile>("profile");
  } catch (error) {
    console.error("Failed to fetch profile from KV:", error);
    return null;
  }
}

function getWeatherIcon(condition: string): string {
  const normalizedCondition = condition.toLowerCase();

  if (
    normalizedCondition.includes("clear") ||
    normalizedCondition.includes("sun")
  ) {
    return "SUN";
  }

  if (normalizedCondition.includes("cloud")) return "CLD";
  if (
    normalizedCondition.includes("rain") ||
    normalizedCondition.includes("drizzle")
  ) {
    return "RAN";
  }
  if (normalizedCondition.includes("snow")) return "SNW";
  if (normalizedCondition.includes("fog")) return "FOG";
  if (normalizedCondition.includes("thunder")) return "STM";

  return "WX";
}

function formatTemperatureRange(weather: Weather): string {
  return `${Math.round(weather.temperature_low)} - ${Math.round(
    weather.temperature_high,
  )}`;
}

function WeatherSignal({ weather }: { weather: Weather | null | undefined }) {
  if (!weather) return null;

  return (
    <section className="daily-profile-signal">
      <div>
        <p className="daily-profile-signal__label">Weather</p>
        <h3>Atlanta</h3>
      </div>
      <div className="daily-profile-weather">
        <span className="daily-profile-weather__mark" aria-hidden="true">
          {getWeatherIcon(weather.condition)}
        </span>
        <div>
          <p className="daily-profile-signal__value">
            {Math.round(weather.temperature)}
            <span aria-hidden="true">&deg;</span>F, {weather.condition}
          </p>
          <p className="daily-profile-signal__meta">
            Today {formatTemperatureRange(weather)}
            <span aria-hidden="true">&deg;</span>F
          </p>
        </div>
      </div>
      <dl className="daily-profile-facts">
        <div>
          <dt>Humidity</dt>
          <dd>
            {weather.mean_humidity}% {weather.humidity_classification}
          </dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>{weather.precipitation_prob}%</dd>
        </div>
      </dl>
      {weather.lastUpdated && (
        <p className="daily-profile-updated">
          Updated {formatUpdatedAt(weather.lastUpdated)}
        </p>
      )}
    </section>
  );
}

function MusicSignal({
  spotify,
}: {
  spotify: Profile["spotify"] | null | undefined;
}) {
  const track: SpotifyTrack | null | undefined = spotify?.track;
  if (!track) return null;

  return (
    <section className="daily-profile-signal">
      <div>
        <p className="daily-profile-signal__label">Music</p>
        <h3>Recently played</h3>
      </div>
      <div className="daily-profile-track">
        <p className="daily-profile-signal__value">{track.title}</p>
        <p className="daily-profile-signal__meta">by {track.artist}</p>
        {track.trackUrl && (
          <a
            href={track.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="daily-profile-link"
          >
            Listen on Spotify
          </a>
        )}
      </div>
      {spotify?.lastUpdated && (
        <p className="daily-profile-updated">
          Updated {formatUpdatedAt(spotify.lastUpdated)}
        </p>
      )}
    </section>
  );
}

function LatestReads({
  articles,
  lastUpdated,
}: {
  articles: ReadingArticle[];
  lastUpdated?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="daily-profile-reads">
      <div className="daily-profile-section-heading">
        <div>
          <p className="daily-profile-signal__label">Reading</p>
          <h3>Latest reads</h3>
        </div>
        {lastUpdated && (
          <p className="daily-profile-updated">
            Updated {formatUpdatedAt(lastUpdated)}
          </p>
        )}
      </div>
      <ul>
        {articles.map((article, index) => (
          <li key={article.url || `article-${article.date}-${article.title}`}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="daily-profile-read-card"
            >
              <span className="daily-profile-read-thumb" aria-hidden="true">
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt="" loading="lazy" />
                ) : (
                  <span
                    className="daily-profile-read-thumb__fallback"
                    data-pattern={getArticlePattern(article, index)}
                  />
                )}
              </span>
              <span className="daily-profile-read-copy">
                <span className="daily-profile-read-title">
                  {article.title}
                </span>
                {article.excerpt && (
                  <span className="daily-profile-read-excerpt">
                    {article.excerpt}
                  </span>
                )}
                {article.source && <small>{article.source}</small>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getArticlePattern(article: ReadingArticle, index: number): string {
  const basis = article.url || article.title;
  let hash = index + 7;

  for (const character of basis) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997;
  }

  return String(hash % 5);
}

export default async function DailyProfileOverlay() {
  const [blurb, profile] = await Promise.all([readBlurb(), readProfile()]);
  const latestArticles = profile?.reading?.articles.slice(0, 3) ?? [];

  return (
    <DailyProfilePanel blurb={blurb}>
      <div className="daily-profile-explainer">
        <p>
          This panel runs on its own (which is why it's in third person). What
          you see is made up of the last track I played on Spotify, the weather
          in my city, and what I'm currently reading in my news feed, updated
          hourly. The short dispatch above is generated from these same signals.
        </p>
      </div>

      <div className="daily-profile-signal-grid">
        <WeatherSignal weather={profile?.weather} />
        <MusicSignal spotify={profile?.spotify} />
      </div>

      <LatestReads
        articles={latestArticles}
        lastUpdated={profile?.reading?.lastUpdated}
      />
    </DailyProfilePanel>
  );
}
