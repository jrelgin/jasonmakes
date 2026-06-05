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
      <div className="spotify-widget tide-panel p-5 text-[var(--ink-muted)]">
        <p>Music data unavailable</p>
        {spotifyData?.lastUpdated && (
          <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wider text-[var(--ink-muted)]">
            Updated {formatUpdatedAt(spotifyData.lastUpdated)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="spotify-widget tide-panel p-5">
      <h3 className="text-lg font-semibold text-[var(--ink-strong)]">
        Recently Played
      </h3>
      <div className="mt-2 flex items-center">
        <span className="mr-3 text-3xl">🎵</span>
        <div className="flex-1">
          <p className="text-lg font-medium text-[var(--ink-strong)]">
            {trackData.title}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            by {trackData.artist}
          </p>
          {trackData.trackUrl && (
            <a
              href={trackData.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-strong)]"
            >
              Listen on Spotify →
            </a>
          )}
        </div>
      </div>
      {spotifyData?.lastUpdated && (
        <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-wider text-[var(--ink-muted)]">
          Updated {formatUpdatedAt(spotifyData.lastUpdated)}
        </p>
      )}
    </div>
  );
}
