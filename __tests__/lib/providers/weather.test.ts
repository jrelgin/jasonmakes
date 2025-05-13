import { describe, it, expect } from 'vitest';
import { mapWeatherCodeToCondition } from '../../../lib/providers/weather';

describe('Weather Provider', () => {
  describe('mapWeatherCodeToCondition', () => {
    // Test common weather codes
    it('should map clear sky code correctly', () => {
      expect(mapWeatherCodeToCondition(0)).toBe('Clear Sky');
    });

    it('should map cloudy conditions correctly', () => {
      expect(mapWeatherCodeToCondition(1)).toBe('Mainly Clear');
      expect(mapWeatherCodeToCondition(2)).toBe('Partly Cloudy');
      expect(mapWeatherCodeToCondition(3)).toBe('Overcast');
    });

    it('should map precipitation correctly', () => {
      expect(mapWeatherCodeToCondition(61)).toBe('Slight Rain');
      expect(mapWeatherCodeToCondition(63)).toBe('Moderate Rain');
      expect(mapWeatherCodeToCondition(65)).toBe('Heavy Rain');
      expect(mapWeatherCodeToCondition(71)).toBe('Slight Snow Fall');
      expect(mapWeatherCodeToCondition(73)).toBe('Moderate Snow Fall');
      expect(mapWeatherCodeToCondition(75)).toBe('Heavy Snow Fall');
    });

    it('should map fog conditions correctly', () => {
      expect(mapWeatherCodeToCondition(45)).toBe('Fog');
      expect(mapWeatherCodeToCondition(48)).toBe('Depositing Rime Fog');
    });

    it('should map thunderstorm conditions correctly', () => {
      expect(mapWeatherCodeToCondition(95)).toBe('Thunderstorm');
      expect(mapWeatherCodeToCondition(96)).toBe('Thunderstorm with Slight Hail');
      expect(mapWeatherCodeToCondition(99)).toBe('Thunderstorm with Heavy Hail');
    });

    it('should return "Unknown" for undefined weather codes', () => {
      expect(mapWeatherCodeToCondition(999)).toBe('Unknown');
      expect(mapWeatherCodeToCondition(-1)).toBe('Unknown');
    });
  });
});
