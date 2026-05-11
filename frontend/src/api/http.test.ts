import { describe, it, expect } from 'vitest';
import { getApiBaseUrl } from './http';

describe('HTTP Client', () => {
  describe('getApiBaseUrl', () => {
    it('should return a valid API URL', () => {
      const result = getApiBaseUrl();
      expect(result).toBeTruthy();
      expect(result).toContain('/api');
    });

    it('should not have trailing slash', () => {
      const result = getApiBaseUrl();
      expect(result.endsWith('/')).toBe(false);
    });

    it('should return consistent URL on multiple calls', () => {
      const result1 = getApiBaseUrl();
      const result2 = getApiBaseUrl();
      expect(result1).toBe(result2);
    });
  });
});
