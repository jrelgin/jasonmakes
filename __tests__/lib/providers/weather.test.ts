import { describe, it, expect } from 'vitest';
import { mapWeatherCodeToCondition, classifyHumidity } from '../../../lib/providers/weather';

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

  describe('classifyHumidity', () => {
    it('should categorize humidity ranges correctly', () => {
      expect(classifyHumidity(0)).toBe('Dry');
      expect(classifyHumidity(30)).toBe('Dry');
      expect(classifyHumidity(31)).toBe('Comfortable');
      expect(classifyHumidity(50)).toBe('Comfortable');
      expect(classifyHumidity(55)).toBe('Somewhat Humid');
      expect(classifyHumidity(70)).toBe('Somewhat Humid');
      expect(classifyHumidity(75)).toBe('Humid');
      expect(classifyHumidity(80)).toBe('Humid');
      expect(classifyHumidity(81)).toBe('Muggy');
    });
  });
});
