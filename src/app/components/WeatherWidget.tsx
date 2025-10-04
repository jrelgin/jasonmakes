export const revalidate = 3600; // 1 hour (matches cron frequency)

import type { Profile } from "#lib/profile";
import { kv } from "#lib/kv";
import type { Weather } from "#lib/providers/weather";
import { formatUpdatedAt } from "@/lib/date";

type WeatherProfile = Pick<Profile, "weather">;

function getWeatherIcon(condition: string): string {
  const normalizedCondition = condition.toLowerCase();

  if (normalizedCondition.includes("clear") || normalizedCondition.includes("sun")) return "☀️";
  if (normalizedCondition.includes("cloud")) return "☁️";
  if (normalizedCondition.includes("rain") || normalizedCondition.includes("drizzle")) return "🌧️";
  if (normalizedCondition.includes("snow")) return "❄️";
  if (normalizedCondition.includes("fog")) return "🌫️";
  if (normalizedCondition.includes("thunder")) return "⚡";

  return "🌡️";
}

function formatTemperatureRange(weather: Weather): string {
  return `${Math.round(weather.temperature_low)}° - ${Math.round(weather.temperature_high)}°F`;
}

export default async function WeatherWidget() {
  let weatherData: Weather | null = null;

  try {
    const profile = await kv.get<WeatherProfile>("profile");
    weatherData = profile?.weather ?? null;
  } catch (error) {
    console.error("Failed to fetch weather data from KV:", error);
  }

  if (!weatherData) {
    return (
      <div className="weather-widget rounded-lg border border-gray-200 bg-gray-100 p-4 text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Weather data unavailable
      </div>
    );
  }

  return (
    <div className="weather-widget rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weather in {weatherData.city}</h3>
      <div className="mt-2 flex items-center">
        <span className="mr-3 text-3xl">{getWeatherIcon(weatherData.condition)}</span>
        <div className="flex-1">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {Math.round(weatherData.temperature)}°F • {weatherData.condition}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Today: {formatTemperatureRange(weatherData)}</p>
        </div>
      </div>

      <dl className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex justify-between">
          <dt>Humidity:</dt>
          <dd className="font-medium">
            {weatherData.mean_humidity}% ({weatherData.humidity_classification})
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Precipitation:</dt>
          <dd className="font-medium">{weatherData.precipitation_prob}%</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Updated {formatUpdatedAt(weatherData.lastUpdated)}
      </p>
    </div>
  );
}
