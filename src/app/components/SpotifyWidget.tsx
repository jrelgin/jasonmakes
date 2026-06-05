export const revalidate = 3600; // 1 hour (matches cron frequency)

import { formatUpdatedAt } from "@/lib/date";
import { kv } from "#lib/kv";
import type { Profile } from "#lib/profile";
import type { SpotifyTrack } from "#lib/providers/spotify";

type SpotifyProfile = Pick<Profile, "spotify">;

export default async function SpotifyWidget() {
  let spotifyData: SpotifyProfile["spotify"] | null = null;
  let trackData: SpotifyTrack | null = null;

  try {
    const profile = await kv.get<SpotifyProfile>("profile");
    spotifyData = profile?.spotify ?? null;
    trackData = spotifyData?.track ?? null;
  } catch (error) {
    console.error("Failed to fetch Spotify data from KV:", error);
  }

  if (!trackData) {
    return (
      <div className="signal-widget spotify-widget">
        <p>Music data unavailable</p>
        {spotifyData?.lastUpdated && (
          <p className="signal-widget__updated">
            Updated {formatUpdatedAt(spotifyData.lastUpdated)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="signal-widget spotify-widget">
      <h3>Recently Played</h3>
      <div className="signal-widget__main">
        <span className="signal-widget__icon">♪</span>
        <div>
          <p className="signal-widget__value">{trackData.title}</p>
          <p className="signal-widget__note">by {trackData.artist}</p>
          {trackData.trackUrl && (
            <a
              href={trackData.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="signal-widget__link"
            >
              Listen on Spotify &rarr;
            </a>
          )}
        </div>
      </div>
      {spotifyData?.lastUpdated && (
        <p className="signal-widget__updated">
          Updated {formatUpdatedAt(spotifyData.lastUpdated)}
        </p>
      )}
    </div>
  );
}
