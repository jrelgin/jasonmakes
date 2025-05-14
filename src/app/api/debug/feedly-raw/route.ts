export const runtime = 'edge';  // fast, no cold-start
export const revalidate = 0;    // always fresh

export async function GET() {
  try {
    // Get feed URL from environment
    const FEED_URL = process.env.FEEDLY_FEED_URL || '';
    
    if (!FEED_URL) {
      throw new Error('Missing FEEDLY_FEED_URL environment variable');
    }
    
    // Add parameters to limit to 5 items and specify JSON format
    const apiUrl = `${FEED_URL}&count=5&format=json`;
    
    // Make the direct API call
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Feedly API error: ${response.status}`);
    }
    
    // Get the raw data
    const rawData = await response.json();
    
    // Return the complete, unmodified API response
    return Response.json({ 
      ok: true, 
      raw_api_response: rawData,
      meta: {
        url: apiUrl,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Debug feedly-raw error →', err);
    return Response.json({ 
      ok: false, 
      error: String(err) 
    }, { 
      status: 500 
    });
  }
}
