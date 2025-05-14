// No imports needed for this simple endpoint

export const runtime = 'edge';  // fast, no cold-start
export const revalidate = 0;    // always fresh

export async function GET() {
  try {
    // Use the same coordinates and parameters as the fetchWeather function
    const latitude = process.env.WEATHER_LATITUDE || '33.749';
    const longitude = process.env.WEATHER_LONGITUDE || '-84.388';
    
    // Ensure longitude is properly formatted with negative sign (Atlanta is in Western hemisphere)
    const formattedLongitude = longitude.startsWith('-') ? longitude : `-${longitude}`;
    
    // Build the URL with the properly formatted longitude and enhanced data points
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${formattedLongitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_probability_max&timezone=auto&temperature_unit=fahrenheit`;
    
    // Use properly formatted longitude for API call
    
    // Make the direct API call
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    // Get the raw data
    const rawData = await response.json();
    
    // Return the complete, unmodified API response
    return Response.json({ 
      ok: true, 
      raw_api_response: rawData,
      meta: {
        url: url,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Debug weather-raw error →', err);
    return Response.json({ 
      ok: false, 
      error: String(err) 
    }, { 
      status: 500 
    });
  }
}
