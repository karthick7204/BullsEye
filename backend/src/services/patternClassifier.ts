import { Candle, Pivot, PatternType, BreakoutDirection, Trendline } from '../types/market';
import { fitTrendline, normalizeSlope, calculateApex } from './trendlineMath';

export interface ClassifiedPattern {
  patternType: PatternType;
  direction: BreakoutDirection;
  upperLine: Trendline;
  lowerLine: Trendline;
  breakoutLevel: number; // Potential breakout price (upper resistance for bullish, lower support for bearish)
  supportLevel: number;
  upperTouches: Pivot[];
  lowerTouches: Pivot[];
  apexIndex?: number;
  confidenceScore: number;
}

export function classifyPattern(
  candles: Candle[],
  highPivots: Pivot[],
  lowPivots: Pivot[]
): ClassifiedPattern | null {
  if (highPivots.length < 2 || lowPivots.length < 2 || candles.length < 20) {
    return null;
  }

  // Use the most recent 3-5 pivots to capture current forming pattern
  const recentHighs = highPivots.slice(-4);
  const recentLows = lowPivots.slice(-4);

  const upperLine = fitTrendline(recentHighs, candles);
  const lowerLine = fitTrendline(recentLows, candles);

  if (!upperLine || !lowerLine) return null;

  // Upper line must be above lower line at pattern start and current candle
  const currentIndex = candles.length - 1;
  const currentUpperPrice = upperLine.slope * currentIndex + upperLine.intercept;
  const currentLowerPrice = lowerLine.slope * currentIndex + lowerLine.intercept;

  if (currentUpperPrice <= currentLowerPrice) {
    return null; // Invalid geometry: lines crossed or inverted
  }

  // Calculate average price across pattern range for slope normalization
  const avgPrice =
    candles.slice(Math.min(upperLine.startIndex, lowerLine.startIndex)).reduce((a, c) => a + c.close, 0) /
    (candles.length - Math.min(upperLine.startIndex, lowerLine.startIndex));

  const normUpperSlope = normalizeSlope(upperLine.slope, avgPrice);
  const normLowerSlope = normalizeSlope(lowerLine.slope, avgPrice);

  const spreadAtStart = upperLine.startPrice - lowerLine.startPrice;
  const spreadAtEnd = currentUpperPrice - currentLowerPrice;
  const isConverging = spreadAtEnd < spreadAtStart;

  const apex = calculateApex(upperLine, lowerLine);
  // For triangles, apex should generally be in the future (or near current candle)
  const apexInFuture = apex ? apex.apexIndex >= currentIndex * 0.9 : false;

  let patternType: PatternType | null = null;
  let direction: BreakoutDirection = 'NEUTRAL';

  // Tolerance constants (% change per 50 candles relative to price)
  const FLAT_TOLERANCE = 2.5; // Slope between -2.5% and +2.5% is considered horizontal
  const TREND_MIN_SLOPE = 2.5; // Greater than 2.5% is considered trending

  // 1. Ascending Triangle: Flat upper resistance, rising lower support, converging
  if (
    Math.abs(normUpperSlope) <= FLAT_TOLERANCE &&
    normLowerSlope >= TREND_MIN_SLOPE &&
    isConverging &&
    apexInFuture
  ) {
    patternType = 'ASCENDING_TRIANGLE';
    direction = 'BULLISH';
  }
  // 2. Descending Triangle: Flat lower support, falling upper resistance, converging
  else if (
    Math.abs(normLowerSlope) <= FLAT_TOLERANCE &&
    normUpperSlope <= -TREND_MIN_SLOPE &&
    isConverging &&
    apexInFuture
  ) {
    patternType = 'DESCENDING_TRIANGLE';
    direction = 'BEARISH';
  }
  // 3. Symmetrical Triangle: Falling upper, rising lower, converging towards apex
  else if (
    normUpperSlope <= -1.8 &&
    normLowerSlope >= 1.8 &&
    isConverging &&
    apexInFuture
  ) {
    patternType = 'SYMMETRICAL_TRIANGLE';
    direction = 'NEUTRAL';
  }
  // 4. Box / Rectangle: Both lines flat, roughly parallel channel
  else if (
    Math.abs(normUpperSlope) <= 2.2 &&
    Math.abs(normLowerSlope) <= 2.2 &&
    Math.abs(normUpperSlope - normLowerSlope) < 3.0
  ) {
    patternType = 'BOX_PATTERN';
    direction = 'NEUTRAL';
  }

  if (!patternType) {
    return null;
  }

  // Calculate confidence score based on R-squared, touch count, and convergence
  const touchFactor = Math.min((recentHighs.length + recentLows.length) / 8, 1.0);
  const r2Factor = (upperLine.rSquared + lowerLine.rSquared) / 2;
  const confidenceScore = Math.round((touchFactor * 0.4 + r2Factor * 0.6) * 100);

  return {
    patternType,
    direction,
    upperLine,
    lowerLine,
    breakoutLevel: currentUpperPrice,
    supportLevel: currentLowerPrice,
    upperTouches: recentHighs,
    lowerTouches: recentLows,
    apexIndex: apex?.apexIndex,
    confidenceScore: Math.max(50, Math.min(99, confidenceScore)),
  };
}

