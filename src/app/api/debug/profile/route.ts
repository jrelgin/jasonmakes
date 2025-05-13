import { NextResponse } from 'next/server';
import { kv, getMockStore } from '../../../../../lib/kv';

/**
 * Debug endpoint to view current profile data
 * Only available in development mode
 */
export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      error: 'Debug endpoints only available in development' 
    }, { 
      status: 403 
    });
  }
  
  try {
    // Get current profile data
    const profile = await kv.get('profile');
    const blurb = await kv.get('blurb');
    
    return NextResponse.json({
      profile,
      blurb,
      mockDetails: getMockStore(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch profile data',
      message: error instanceof Error ? error.message : String(error)
    }, {
      status: 500
    });
  }
}

/**
 * Required for Next.js App Router to allow passing params in the URL
 */
export const dynamic = 'force-dynamic';
