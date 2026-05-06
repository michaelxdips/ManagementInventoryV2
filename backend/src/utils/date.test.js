import { describe, it, expect, vi, afterEach } from 'vitest';
import { getWIBDate } from './date.js';

describe('date utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns current date in YYYY-MM-DD format for Asia/Jakarta timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-05T10:00:00.000Z'));

    expect(getWIBDate()).toBe('2026-05-05');
  });

  it('uses WIB timezone instead of local/UTC date near midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-05T18:00:00.000Z'));

    expect(getWIBDate()).toBe('2026-05-06');
  });

  it('always returns ISO-like calendar format', () => {
    expect(getWIBDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
