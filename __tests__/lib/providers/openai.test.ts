import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies used inside the provider
const createMock = vi.fn();
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: createMock } }
  }))
}));

vi.mock('../../../lib/kv', () => ({
  kv: { get: vi.fn() }
}));

vi.mock('@vercel/edge-config', () => ({
  get: vi.fn()
}));

import { kv } from '../../../lib/kv';
import { get } from '@vercel/edge-config';
import { generateBlurb } from '../../../lib/providers/openai';

const baseProfile = {
  weather: {
    temperature: 70,
    condition: 'Sunny',
    city: 'Miami',
    temperature_high: 75,
    temperature_low: 65,
    mean_humidity: 40,
    precipitation_prob: 0,
    humidity_classification: 'Comfortable'
  },
  feedly: { articles: [{ title: 'Article', url: '', date: 0, source: 'Src', excerpt: 'Ex' }], lastUpdated: '' },
  spotify: { track: { title: 'Song', artist: 'Artist', album: '', coverUrl: '', trackUrl: '', playedAt: '' }, lastUpdated: '' }
};

describe('generateBlurb', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns OpenAI response when request succeeds', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'hi' } }] });
    vi.mocked(get).mockResolvedValue('prompt');

    const result = await generateBlurb(baseProfile as any, 50);
    expect(result).toBe('hi');
    expect(createMock).toHaveBeenCalled();
  });

  it('falls back to previous blurb from KV on error', async () => {
    createMock.mockRejectedValue(new Error('fail'));
    vi.mocked(kv.get).mockResolvedValue('old blurb');

    const result = await generateBlurb(baseProfile as any, 50);
    expect(result).toBe('old blurb');
  });

  it('uses default message when OpenAI and KV both fail', async () => {
    createMock.mockRejectedValue(new Error('fail'));
    vi.mocked(kv.get).mockResolvedValue(null);

    const result = await generateBlurb(baseProfile as any, 50);
    expect(result).toContain('Miami');
  });
});
