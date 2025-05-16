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
    return <div className="weather-widget p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 rounded-lg">Weather data unavailable</div>;
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
  
  // Helper to format temperature range
  const formatTempRange = () => {
    return `${Math.round(weatherData?.temperature_low || 0)}° - ${Math.round(weatherData?.temperature_high || 0)}°F`;
  };
  
  return (
    <div className="weather-widget p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather in {weatherData.city}</h3>
      <div className="flex items-center mt-2">
        <span className="text-3xl mr-3">{getWeatherIcon(weatherData.condition)}</span>
        <div className="flex-1">
          <p className="font-medium text-lg text-gray-900 dark:text-white">{Math.round(weatherData.temperature)}°F • {weatherData.condition}</p>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">Today: {formatTempRange()}</p>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
        <p className="flex justify-between">
          <span>Humidity:</span> 
          <span className="font-medium">{weatherData.mean_humidity}% ({weatherData.humidity_classification})</span>
        </p>
        <p className="flex justify-between">
          <span>Precipitation:</span> 
          <span className="font-medium">{weatherData.precipitation_prob}%</span>
        </p>
      </div>
    </div>
  );
}
