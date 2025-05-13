// app/components/WeatherWidget.tsx
export const revalidate = 86_400; // 24 hours (daily refresh)

import { kv } from '../../../lib/kv';
import type { Weather } from '../../../lib/providers/weather';

export default async function WeatherWidget() {
  let weatherData: Weather | null = null;
  
  try {
    // Fetch profile data from Vercel KV
    const profile = await kv.get('profile') as { weather: Weather } | null;
    weatherData = profile?.weather || null;
  } catch (error) {
    console.error('Failed to fetch weather data from KV:', error);
  }
  
  if (!weatherData) {
    return <div className="weather-widget p-4 bg-gray-100 rounded-lg">Weather data unavailable</div>;
  }
  
  // Choose icon based on weather condition
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sun')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('fog')) return '🌫️';
    if (conditionLower.includes('thunder')) return '⚡';
    
    return '🌡️'; // Default icon
  };
  
  return (
    <div className="weather-widget p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold">Current Weather</h3>
      <div className="flex items-center mt-2">
        <span className="text-2xl mr-2">{getWeatherIcon(weatherData.condition)}</span>
        <div>
          <p className="font-medium">{weatherData.city}</p>
          <p>{weatherData.temperature}°F • {weatherData.condition}</p>
        </div>
      </div>
    </div>
  );
}
