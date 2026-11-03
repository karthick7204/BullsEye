import { Candle, Pivot, Trendline } from '../types/market';

/**
 * Fits a linear regression trendline (y = mx + c) through an array of pivot points.
 */
export function fitTrendline(pivots: Pivot[], candles: Candle[]): Trendline | null {
  if (pivots.length < 2) return null;

  const n = pivots.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const p of pivots) {
    sumX += p.index;
    sumY += p.price;
    sumXY += p.index * p.price;
    sumX2 += p.index * p.index;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Compute R-squared (coefficient of determination)
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  for (const p of pivots) {
    const predicted = slope * p.index + intercept;
    ssTot += Math.pow(p.price - meanY, 2);
    ssRes += Math.pow(p.price - predicted, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  const firstPivot = pivots[0];
  const lastIndex = candles.length - 1;

  const startIndex = firstPivot.index;
  const endIndex = lastIndex;

  const startPrice = slope * startIndex + intercept;
  const endPrice = slope * endIndex + intercept;

  const startTime = candles[startIndex]?.time || firstPivot.time;
  const endTime = candles[endIndex]?.time || candles[candles.length - 1].time;

  return {
    slope,
    intercept,
    rSquared,
    startIndex,
    endIndex,
    startTime,
    endTime,
    startPrice,
    endPrice,
  };
}

/**
 * Computes Average True Range (ATR) across the candles to normalize price volatility.
 */
export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 1.0;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }

  const slice = trs.slice(-period);
  const avgTR = slice.reduce((acc, v) => acc + v, 0) / slice.length;
  return avgTR > 0 ? avgTR : 1.0;
}

/**
 * Normalizes slope relative to average price and candle span.
 * Normalized slope = (Price change across 50 candles / Average Price) * 100%
 */
export function normalizeSlope(slope: number, avgPrice: number, span: number = 50): number {
  if (avgPrice <= 0) return slope;
  return ((slope * span) / avgPrice) * 100;
}

/**
 * Calculates the apex (intersection point) of two converging trendlines.
 */
export function calculateApex(
  upper: Trendline,
  lower: Trendline
): { apexIndex: number; apexPrice: number } | null {
  const slopeDiff = upper.slope - lower.slope;
  if (Math.abs(slopeDiff) < 1e-6) return null; // Lines are parallel

  const apexIndex = (lower.intercept - upper.intercept) / slopeDiff;
  const apexPrice = upper.slope * apexIndex + upper.intercept;

  return { apexIndex, apexPrice };
}

