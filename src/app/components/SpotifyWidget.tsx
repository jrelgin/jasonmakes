// app/components/SpotifyWidget.tsx
export const revalidate = 86_400; // 24 hours (daily refresh)

import { kv } from '../../../lib/kv';
import type { SpotifyTrack } from '../../../lib/providers/spotify';

export default async function SpotifyWidget() {
  let trackData: SpotifyTrack | null = null;
  // Track last updated timestamp for future use if needed
  
  try {
    // Fetch profile data from Vercel KV
    const profile = await kv.get('profile') as { spotify?: { track: SpotifyTrack | null, lastUpdated: string } } | null;
    trackData = profile?.spotify?.track || null;
    // We could track lastUpdated here if needed in the future
  } catch (error) {
    console.error('Failed to fetch Spotify data from KV:', error);
  }
  
  if (!trackData) {
    return <div className="spotify-widget p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-lg">Music data unavailable</div>;
  }
  
  // Format the played at date
  const formatPlayedAt = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
      } else if (diffMins < 24 * 60) {
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      }
      
      // More than a day ago
      const diffDays = Math.floor(diffMins / (60 * 24));
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } catch {
      return 'Recently';
    }
  };
  
  return (
    <div className="spotify-widget p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Played</h3>
      <div className="flex items-center mt-2">
        <span className="text-3xl mr-3">🎵</span>
        <div className="flex-1">
          <p className="font-medium text-lg text-gray-900 dark:text-white">{trackData.title}</p>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
            by {trackData.artist}
          </p>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {formatPlayedAt(trackData.playedAt)}
          </p>
          {trackData.trackUrl && (
            <a 
              href={trackData.trackUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Listen on Spotify →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
