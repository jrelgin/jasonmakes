/**
 * Simple Spotify OAuth initiator
 * 
 * How to use:
 * 1. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env.local
 * 2. Visit http://localhost:3000/api/auth/spotify in your browser
 * 3. Complete the Spotify authorization
 * 4. Copy the refresh token from the callback response
 * 
 * WARNING: Don't deploy this to production. It should only be used locally 
 * to generate your refresh token.
 */

import { redirect } from 'next/navigation';

/**
 * First step: redirect to Spotify authorization page
 * This simply redirects to Spotify's auth page, which will then redirect
 * to our callback route after successful authorization
 */
export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return new Response('Missing SPOTIFY_CLIENT_ID in environment variables', { status: 500 });
  }
  
  // Use the loopback URI that matches what's registered in Spotify Dashboard
  const redirectUri = 'http://127.0.0.1:3000/api/auth/callback/spotify';
  
  // Build the Spotify authorization URL
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', 'user-read-recently-played');
  
  return redirect(authUrl.toString());
}
