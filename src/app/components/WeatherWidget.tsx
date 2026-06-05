export const revalidate = 3600; // 1 hour (matches cron frequency)

import { formatUpdatedAt } from "@/lib/date";
import { kv } from "#lib/kv";
import type { Profile } from "#lib/profile";
import type { Weather } from "#lib/providers/weather";

type WeatherProfile = Pick<Profile, "weather">;

function getWeatherIcon(condition: string): string {
  const normalizedCondition = condition.toLowerCase();

  if (
    normalizedCondition.includes("clear") ||
    normalizedCondition.includes("sun")
  )
    return "☀️";
  if (normalizedCondition.includes("cloud")) return "☁️";
  if (
    normalizedCondition.includes("rain") ||
    normalizedCondition.includes("drizzle")
  )
    return "🌧️";
  if (normalizedCondition.includes("snow")) return "❄️";
  if (normalizedCondition.includes("fog")) return "🌫️";
  if (normalizedCondition.includes("thunder")) return "⚡";

  return "🌡️";
}

function formatTemperatureRange(weather: Weather): string {
  return `${Math.round(weather.temperature_low)}° - ${Math.round(
    weather.temperature_high,
  )}°F`;
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
      <div className="signal-widget weather-widget">
        Weather data unavailable
      </div>
    );
  }

  return (
    <div className="signal-widget weather-widget">
      <h3>Weather in {weatherData.city}</h3>
      <div className="signal-widget__main">
        <span className="signal-widget__icon">
          {getWeatherIcon(weatherData.condition)}
        </span>
        <div>
          <p className="signal-widget__value">
            {Math.round(weatherData.temperature)}°F • {weatherData.condition}
          </p>
          <p className="signal-widget__note">
            Today: {formatTemperatureRange(weatherData)}
          </p>
        </div>
      </div>

      <dl className="signal-widget__list">
        <div>
          <dt>Humidity:</dt>
          <dd>
            {weatherData.mean_humidity}% ({weatherData.humidity_classification})
          </dd>
        </div>
        <div>
          <dt>Precipitation:</dt>
          <dd>{weatherData.precipitation_prob}%</dd>
        </div>
      </dl>

      <p className="signal-widget__updated">
        Updated {formatUpdatedAt(weatherData.lastUpdated)}
      </p>
    </div>
  );
}
