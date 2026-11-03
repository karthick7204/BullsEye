import { Candle, PatternResult } from '../types/market';
import { findPivots } from './pivotDetector';
import { classifyPattern } from './patternClassifier';
import { analyzeBreakout } from './breakoutAnalyzer';

export interface ScanResult {
  symbol: string;
  hasPattern: boolean;
  pattern: PatternResult | null;
  highPivotsCount: number;
  lowPivotsCount: number;
  latestPrice: number;
}

/**
 * Runs the full pattern detection & breakout analysis pipeline on a set of candles.
 */
export function analyzeStockCandles(symbol: string, candles: Candle[]): ScanResult {
  if (candles.length < 25) {
    return {
      symbol,
      hasPattern: false,
      pattern: null,
      highPivotsCount: 0,
      lowPivotsCount: 0,
      latestPrice: candles.length > 0 ? candles[candles.length - 1].close : 0,
    };
  }

  const latestCandle = candles[candles.length - 1];
  const { highs, lows } = findPivots(candles, 4);

  const classified = classifyPattern(candles, highs, lows);

  if (!classified) {
    return {
      symbol,
      hasPattern: false,
      pattern: null,
      highPivotsCount: highs.length,
      lowPivotsCount: lows.length,
      latestPrice: latestCandle.close,
    };
  }

  const breakout = analyzeBreakout(
    candles,
    classified.breakoutLevel,
    classified.supportLevel,
    classified.direction
  );

  const patternResult: PatternResult = {
    id: `${symbol}_${classified.patternType}_${Date.now()}`,
    symbol,
    patternType: classified.patternType,
    direction: classified.direction,
    upperLine: classified.upperLine,
    lowerLine: classified.lowerLine,
    breakoutLevel: Number(classified.breakoutLevel.toFixed(2)),
    supportLevel: Number(classified.supportLevel.toFixed(2)),
    currentPrice: Number(breakout.currentPrice.toFixed(2)),
    proximityPercent: breakout.proximityPercent,
    status: breakout.status,
    volumeMultiplier: breakout.volumeMultiplier,
    hasVolumeSurge: breakout.hasVolumeSurge,
    confidenceScore: classified.confidenceScore,
    upperTouches: classified.upperTouches,
    lowerTouches: classified.lowerTouches,
    apexIndex: classified.apexIndex,
    apexTime: classified.apexIndex && candles[Math.min(Math.round(classified.apexIndex), candles.length - 1)]
      ? candles[Math.min(Math.round(classified.apexIndex), candles.length - 1)].time
      : undefined,
    detectedAt: Date.now(),
  };

  return {
    symbol,
    hasPattern: true,
    pattern: patternResult,
    highPivotsCount: highs.length,
    lowPivotsCount: lows.length,
    latestPrice: latestCandle.close,
  };
}

