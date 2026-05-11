import { describe, it, expect } from 'vitest';
import { formatDateV2, getWIBInputDate, formatWIBDateTime } from './dateUtils';

describe('Date Utils', () => {
  describe('formatDateV2', () => {
    it('should format date string to DD/MM/YYYY', () => {
      const date = '2026-05-11T10:30:00Z';
      const result = formatDateV2(date);
      // formatDateV2 returns DD/MM/YYYY format
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2026-05-11T10:30:00Z');
      const result = formatDateV2(date);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should return dash for invalid input', () => {
      // formatDateV2 returns '-' for invalid input, not empty string
      expect(formatDateV2('')).toBe('-');
      expect(formatDateV2(null as any)).toBe('-');
      expect(formatDateV2(undefined as any)).toBe('-');
    });
  });

  describe('getWIBInputDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = new Date('2026-05-11T10:30:00Z');
      const result = getWIBInputDate(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should default to today when no date provided', () => {
      const result = getWIBInputDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return empty string for null input', () => {
      expect(getWIBInputDate(null)).toBe('');
    });
  });

  describe('formatWIBDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2026-05-11T10:30:00Z');
      const result = formatWIBDateTime(date);
      // Should include date and time
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{2}/);
    });

    it('should return dash for invalid input', () => {
      expect(formatWIBDateTime('')).toBe('-');
      expect(formatWIBDateTime(null)).toBe('-');
    });
  });
});
