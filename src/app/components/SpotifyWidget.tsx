export const revalidate = 3600; // 1 hour (matches cron frequency)

import type { Profile } from "#lib/profile";
import { kv } from "#lib/kv";
import type { SpotifyTrack } from "#lib/providers/spotify";

type SpotifyProfile = Pick<Profile, "spotify">;

export default async function SpotifyWidget() {
  let trackData: SpotifyTrack | null = null;

  try {
    const profile = await kv.get<SpotifyProfile>("profile");
    trackData = profile?.spotify.track ?? null;
  } catch (error) {
    console.error("Failed to fetch Spotify data from KV:", error);
  }

  if (!trackData) {
    return (
      <div className="spotify-widget rounded-lg border border-gray-200 bg-gray-100 p-4 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Music data unavailable
      </div>
    );
  }

  return (
    <div className="spotify-widget rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Played</h3>
      <div className="mt-2 flex items-center">
        <span className="mr-3 text-3xl">🎵</span>
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-900 dark:text-white">{trackData.title}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">by {trackData.artist}</p>
          {trackData.trackUrl && (
            <a
              href={trackData.trackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Listen on Spotify →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
