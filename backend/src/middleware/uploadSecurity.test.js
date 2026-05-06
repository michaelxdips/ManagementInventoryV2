import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateExcelUpload,
  sanitizeExcelData,
  sanitizeExcelMiddleware,
} from './uploadSecurity.js';

describe('upload security middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      file: null,
      setTimeout: vi.fn(),
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateExcelUpload', () => {
    it('rejects requests without file or items', () => {
      validateExcelUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'File Excel atau data tidak ditemukan' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects files larger than 5MB', () => {
      req.file = {
        size: 5 * 1024 * 1024 + 1,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      validateExcelUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({ message: 'File terlalu besar. Maksimal 5MB.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects invalid file mime types', () => {
      req.file = { size: 1024, mimetype: 'text/plain' };

      validateExcelUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Format file tidak valid. Hanya .xlsx dan .xls yang diizinkan.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts xlsx files and sets timeout', () => {
      req.file = {
        size: 1024,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      validateExcelUpload(req, res, next);

      expect(req.setTimeout).toHaveBeenCalledWith(30000, expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    it('accepts legacy xls files', () => {
      req.file = { size: 1024, mimetype: 'application/vnd.ms-excel' };

      validateExcelUpload(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects non-array JSON items', () => {
      req.body.items = { invalid: true };

      validateExcelUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Format data tidak valid' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects JSON uploads with more than 5000 rows', () => {
      req.body.items = Array.from({ length: 5001 }, (_, id) => ({ id }));

      validateExcelUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(413);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Terlalu banyak data. Maksimal 5000 baris per upload.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('accepts JSON uploads at the 5000 row limit', () => {
      req.body.items = Array.from({ length: 5000 }, (_, id) => ({ id }));

      validateExcelUpload(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('sends timeout response when timeout callback fires', () => {
      req.body.items = [];

      validateExcelUpload(req, res, next);
      const timeoutHandler = req.setTimeout.mock.calls[0][1];
      timeoutHandler();

      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Request timeout. File terlalu kompleks atau koneksi lambat.',
      });
    });
  });

  describe('sanitizeExcelData', () => {
    it('returns an empty array for non-array input', () => {
      expect(sanitizeExcelData(null)).toEqual([]);
      expect(sanitizeExcelData({})).toEqual([]);
    });

    it('keeps only allowed keys and removes prototype pollution fields', () => {
      const input = [
        {
          nama_barang: ' Pulpen ',
          kode_barang: ' P-001 ',
          qty: 10,
          satuan: 'pcs',
          lokasi_simpan: 'Rak A',
          min_stock: 5,
          role: 'superadmin',
          __proto__: { polluted: true },
        },
      ];

      const [clean] = sanitizeExcelData(input);

      expect(Object.getPrototypeOf(clean)).toBeNull();
      expect(clean).toEqual({
        nama_barang: 'Pulpen',
        kode_barang: 'P-001',
        qty: 10,
        satuan: 'pcs',
        lokasi_simpan: 'Rak A',
        min_stock: 5,
      });
      expect(clean.role).toBeUndefined();
      expect(clean.polluted).toBeUndefined();
    });

    it('truncates long strings to 255 characters', () => {
      const longValue = 'x'.repeat(300);
      const [clean] = sanitizeExcelData([{ nama_barang: longValue }]);

      expect(clean.nama_barang).toHaveLength(255);
    });

    it('converts non-finite numbers to zero', () => {
      const [clean] = sanitizeExcelData([{ qty: Number.NaN, min_stock: Number.POSITIVE_INFINITY }]);

      expect(clean.qty).toBe(0);
      expect(clean.min_stock).toBe(0);
    });

    it('preserves allowed non-string non-number values for downstream validation', () => {
      const value = { raw: true };
      const [clean] = sanitizeExcelData([{ lokasi_simpan: value }]);

      expect(clean.lokasi_simpan).toBe(value);
    });
  });

  describe('sanitizeExcelMiddleware', () => {
    it('sanitizes request body items when present', () => {
      req.body.items = [{ nama_barang: ' Buku ', extra: 'remove' }];

      sanitizeExcelMiddleware(req, res, next);

      expect(req.body.items[0].nama_barang).toBe('Buku');
      expect(req.body.items[0].extra).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('passes through when items are absent', () => {
      sanitizeExcelMiddleware(req, res, next);

      expect(req.body).toEqual({});
      expect(next).toHaveBeenCalled();
    });
  });
});
