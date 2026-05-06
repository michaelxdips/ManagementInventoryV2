import { describe, it, expect, vi } from 'vitest';
import { parsePagination, buildPagination, sendPaginated } from './pagination.js';

describe('pagination utilities', () => {
  describe('parsePagination', () => {
    it('uses defaults when query is empty', () => {
      expect(parsePagination({})).toEqual({ page: 1, perPage: 15, offset: 0 });
    });

    it('parses valid page and perPage values', () => {
      expect(parsePagination({ page: '3', perPage: '20' })).toEqual({
        page: 3,
        perPage: 20,
        offset: 40,
      });
    });

    it('falls back for invalid and non-positive values', () => {
      expect(parsePagination({ page: '-1', perPage: '0' })).toEqual({
        page: 1,
        perPage: 15,
        offset: 0,
      });
      expect(parsePagination({ page: 'abc', perPage: 'NaN' })).toEqual({
        page: 1,
        perPage: 15,
        offset: 0,
      });
    });

    it('honors custom defaults and max per page', () => {
      expect(
        parsePagination({ page: '', perPage: '500' }, { page: 2, perPage: 25, maxPerPage: 100 })
      ).toEqual({ page: 2, perPage: 100, offset: 100 });
    });
  });

  describe('buildPagination', () => {
    it('builds pagination metadata', () => {
      expect(buildPagination({ page: 2, perPage: 10, total: 35 })).toEqual({
        page: 2,
        perPage: 10,
        total: 35,
        totalPages: 4,
      });
    });

    it('never returns less than one total page', () => {
      expect(buildPagination({ page: 1, perPage: 10, total: 0 }).totalPages).toBe(1);
    });
  });

  describe('sendPaginated', () => {
    it('sends rows under the provided key with pagination metadata', () => {
      const res = { json: vi.fn() };
      const rows = [{ id: 1 }];
      const pagination = { page: 1, perPage: 15, total: 1, totalPages: 1 };

      sendPaginated(res, 'items', rows, pagination);

      expect(res.json).toHaveBeenCalledWith({ items: rows, pagination });
    });
  });
});
