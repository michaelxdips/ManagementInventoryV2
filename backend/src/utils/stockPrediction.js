/**
 * Stock Prediction Utility
 *
 * This is intentionally simple and operational:
 * - Uses the last 30 days of stock-out history as the baseline.
 * - Compares it with the previous 30 days to show trend.
 * - Returns only actionable alerts, not every slow-moving item.
 */

const toNumber = (value) => Number(value) || 0;

const getTrend = (monthlyOut, previousMonthlyOut) => {
  if (previousMonthlyOut <= 0) return 'stable';

  const changeRatio = (monthlyOut - previousMonthlyOut) / previousMonthlyOut;
  if (changeRatio >= 0.2) return 'increasing';
  if (changeRatio <= -0.2) return 'decreasing';
  return 'stable';
};

const getAlertLevel = ({ daysUntilStockout, currentStock, minStock }) => {
  if (daysUntilStockout <= 7 || currentStock <= minStock) return 'critical';
  if (daysUntilStockout <= 30) return 'warning';
  return 'normal';
};

/**
 * Predict stock depletion for a single item.
 *
 * @param {Object} item
 * @param {string} item.nama_barang
 * @param {number} item.current_stock
 * @param {number} item.min_stock
 * @param {number} item.monthly_out Total outgoing qty in the last 30 days
 * @param {number} item.previous_monthly_out Total outgoing qty in the previous 30 days
 * @returns {Object|null}
 */
export const predictStockDepletion = (item) => {
  const currentStock = toNumber(item.current_stock);
  const minStock = toNumber(item.min_stock);
  const monthlyOut = toNumber(item.monthly_out ?? item.monthlyOut);
  const previousMonthlyOut = toNumber(item.previous_monthly_out ?? item.previousMonthlyOut);

  if (currentStock <= 0 || monthlyOut <= 0) {
    return null;
  }

  const dailyUsageRate = monthlyOut / 30;
  const daysUntilStockout = currentStock / dailyUsageRate;
  const alertLevel = getAlertLevel({ daysUntilStockout, currentStock, minStock });

  // Dashboard widget should not show slow-moving normal stock because it creates
  // noisy predictions like tens of thousands of days.
  if (alertLevel === 'normal') {
    return null;
  }

  const trend = getTrend(monthlyOut, previousMonthlyOut);
  const recommendedReorderQty = Math.max(
    Math.ceil(dailyUsageRate * 30),
    Math.max(minStock * 2 - currentStock, 0)
  );

  return {
    nama_barang: item.nama_barang,
    current_stock: currentStock,
    min_stock: minStock,
    monthly_out: monthlyOut,
    previous_monthly_out: previousMonthlyOut,
    daysUntilStockout: Math.max(0, Math.ceil(daysUntilStockout)),
    dailyUsageRate: parseFloat(dailyUsageRate.toFixed(2)),
    trend,
    recommendedReorderQty,
    alertLevel,
  };
};

/**
 * Batch predict and sort by urgency.
 */
export const batchPredict = (items) => {
  return items
    .map((item) => predictStockDepletion(item))
    .filter(Boolean)
    .sort((a, b) => {
      const alertOrder = { critical: 0, warning: 1, normal: 2 };
      if (alertOrder[a.alertLevel] !== alertOrder[b.alertLevel]) {
        return alertOrder[a.alertLevel] - alertOrder[b.alertLevel];
      }
      return a.daysUntilStockout - b.daysUntilStockout;
    });
};
