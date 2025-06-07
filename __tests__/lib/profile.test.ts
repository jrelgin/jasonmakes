import { describe, it, expect, vi, beforeEach } from 'vitest';

const weatherMock = vi.fn();
const feedlyMock = vi.fn();
const spotifyMock = vi.fn();

vi.mock('../lib/providers/weather', () => ({ fetchWeather: weatherMock }));
vi.mock('../lib/providers/feedly', () => ({ fetchFeedly: feedlyMock }));
vi.mock('../lib/providers/spotify', () => ({ fetchSpotify: spotifyMock }));

let buildProfile: typeof import('../lib/profile').buildProfile;

const mockWeather = {
  temperature: 70,
  condition: 'Sunny',
  city: 'Atlanta',
  temperature_high: 75,
  temperature_low: 65,
  mean_humidity: 40,
  precipitation_prob: 0,
  humidity_classification: 'Comfortable'
};
const mockFeedly = { articles: [], lastUpdated: '' };
const mockSpotify = { track: null, lastUpdated: '' };

describe('buildProfile', () => {
  beforeEach(async () => {
    vi.resetModules();
    weatherMock.mockResolvedValue(mockWeather);
    feedlyMock.mockResolvedValue(mockFeedly);
    spotifyMock.mockResolvedValue(mockSpotify);
    process.env.NODE_ENV = 'development';
    buildProfile = (await import('../lib/profile')).buildProfile;
  });

  it('uses in-memory cache in development', async () => {
    await buildProfile();
    expect(weatherMock).toHaveBeenCalledTimes(1);
    await buildProfile();
    expect(weatherMock).toHaveBeenCalledTimes(1);
  });

  it('falls back on weather error', async () => {
    weatherMock.mockRejectedValueOnce(new Error('fail'));
    const result = await buildProfile();
    expect(result.weather.condition).toBe('Unknown');
    expect(result.weather.city).toBe('Atlanta');
  });
});

