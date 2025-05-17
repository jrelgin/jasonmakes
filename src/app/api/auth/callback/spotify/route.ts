/**
 * Spotify OAuth callback handler
 * This endpoint receives the authorization code and exchanges it for tokens
 */

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the code from query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  // Handle authorization errors
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  
  // Ensure we have an authorization code
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }
  
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing Spotify credentials' }, 
        { status: 500 }
      );
    }
    
    // The redirect URI must exactly match what's registered in the Spotify Developer Dashboard
    const redirectUri = 'http://127.0.0.1:3000/api/auth/callback/spotify';
    
    // Exchange the code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }),
      cache: 'no-store'
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json(
        { error: `Failed to get token: ${errorText}` },
        { status: tokenResponse.status }
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Format the response with clear instructions
    return NextResponse.json({
      message: 'Authentication successful! Add this refresh token to your .env.local file:',
      environment_variable: `SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}`,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expires_in: tokens.expires_in
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Auth error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
