import { describe, it, expect } from 'vitest';
import { predictStockDepletion, batchPredict } from './stockPrediction.js';

describe('Stock Prediction', () => {
  describe('predictStockDepletion', () => {
    it('should return null when stock is empty or no monthly usage exists', () => {
      expect(predictStockDepletion({ nama_barang: 'Empty', current_stock: 0, monthly_out: 100 })).toBeNull();
      expect(predictStockDepletion({ nama_barang: 'No Usage', current_stock: 100, monthly_out: 0 })).toBeNull();
    });

    it('should return null for non-actionable slow moving stock', () => {
      const result = predictStockDepletion({
        nama_barang: 'Slow Item',
        current_stock: 5000,
        min_stock: 10,
        monthly_out: 30,
        previous_monthly_out: 30,
      });

      expect(result).toBeNull();
    });

    it('should create warning alert when item will run out within 30 days', () => {
      const result = predictStockDepletion({
        nama_barang: 'Warning Item',
        current_stock: 100,
        min_stock: 10,
        monthly_out: 300,
        previous_monthly_out: 260,
      });

      expect(result).not.toBeNull();
      expect(result.daysUntilStockout).toBe(10);
      expect(result.dailyUsageRate).toBe(10);
      expect(result.alertLevel).toBe('warning');
      expect(result.trend).toBe('stable');
      expect(result.recommendedReorderQty).toBe(300);
    });

    it('should create critical alert when item will run out within 7 days', () => {
      const result = predictStockDepletion({
        nama_barang: 'Critical Item',
        current_stock: 30,
        min_stock: 10,
        monthly_out: 300,
        previous_monthly_out: 100,
      });

      expect(result).not.toBeNull();
      expect(result.daysUntilStockout).toBe(3);
      expect(result.alertLevel).toBe('critical');
      expect(result.trend).toBe('increasing');
    });

    it('should create critical alert when current stock is below min stock', () => {
      const result = predictStockDepletion({
        nama_barang: 'Low Stock Item',
        current_stock: 5,
        min_stock: 10,
        monthly_out: 10,
        previous_monthly_out: 20,
      });

      expect(result).not.toBeNull();
      expect(result.alertLevel).toBe('critical');
      expect(result.trend).toBe('decreasing');
    });

    it('should recommend at least enough stock to restore min-stock buffer', () => {
      const result = predictStockDepletion({
        nama_barang: 'Buffer Item',
        current_stock: 2,
        min_stock: 10,
        monthly_out: 3,
        previous_monthly_out: 3,
      });

      expect(result).not.toBeNull();
      expect(result.recommendedReorderQty).toBe(18); // min_stock * 2 - current_stock
    });
  });

  describe('batchPredict', () => {
    it('should sort actionable predictions by urgency and hide normal items', () => {
      const items = [
        { nama_barang: 'Normal Item', current_stock: 1000, min_stock: 10, monthly_out: 30, previous_monthly_out: 30 },
        { nama_barang: 'Warning Item', current_stock: 100, min_stock: 10, monthly_out: 300, previous_monthly_out: 250 },
        { nama_barang: 'Critical Item', current_stock: 30, min_stock: 10, monthly_out: 300, previous_monthly_out: 100 },
      ];

      const results = batchPredict(items);

      expect(results).toHaveLength(2);
      expect(results[0].nama_barang).toBe('Critical Item');
      expect(results[0].alertLevel).toBe('critical');
      expect(results[1].nama_barang).toBe('Warning Item');
      expect(results[1].alertLevel).toBe('warning');
    });
  });
});
