import { Candle, BreakoutStatus, PatternType, BreakoutDirection } from '../types/market';

export interface BreakoutAnalysis {
  currentPrice: number;
  breakoutLevel: number;
  supportLevel: number;
  proximityPercent: number;
  status: BreakoutStatus;
  volumeMultiplier: number;
  hasVolumeSurge: boolean;
  smaVolume: number;
  currentVolume: number;
}

export function analyzeBreakout(
  candles: Candle[],
  upperLevel: number,
  lowerLevel: number,
  direction: BreakoutDirection
): BreakoutAnalysis {
  if (candles.length === 0) {
    return {
      currentPrice: 0,
      breakoutLevel: upperLevel,
      supportLevel: lowerLevel,
      proximityPercent: 0,
      status: 'IN_PATTERN',
      volumeMultiplier: 1.0,
      hasVolumeSurge: false,
      smaVolume: 0,
      currentVolume: 0,
    };
  }

  const latestCandle = candles[candles.length - 1];
  const currentPrice = latestCandle.close;

  // Determine which level to measure proximity against based on pattern bias
  let targetLevel = upperLevel;
  if (direction === 'BEARISH') {
    targetLevel = lowerLevel;
  } else if (direction === 'NEUTRAL') {
    // Whichever is closer
    const distToUpper = Math.abs(upperLevel - currentPrice);
    const distToLower = Math.abs(currentPrice - lowerLevel);
    targetLevel = distToUpper <= distToLower ? upperLevel : lowerLevel;
  }

  const proximityPercent = Number(
    ((Math.abs(targetLevel - currentPrice) / currentPrice) * 100).toFixed(2)
  );

  // Volume Analysis (20-period SMA)
  const volumeSlice = candles.slice(-21, -1).map((c) => c.volume);
  const smaVolume =
    volumeSlice.length > 0
      ? volumeSlice.reduce((a, b) => a + b, 0) / volumeSlice.length
      : latestCandle.volume;

  const currentVolume = latestCandle.volume;
  const volumeMultiplier =
    smaVolume > 0 ? Number((currentVolume / smaVolume).toFixed(2)) : 1.0;
  const hasVolumeSurge = volumeMultiplier >= 1.5;

  // Determine status
  let status: BreakoutStatus = 'IN_PATTERN';

  const BUFFER = 0.0015; // 0.15% clearance for confirmed break
  if (currentPrice > upperLevel * (1 + BUFFER)) {
    status = 'CONFIRMED_BREAKOUT';
  } else if (currentPrice < lowerLevel * (1 - BUFFER)) {
    status = 'CONFIRMED_BREAKDOWN';
  } else if (proximityPercent <= 0.4) {
    status = 'AT_BREAKOUT_LEVEL';
  } else if (proximityPercent <= 1.8) {
    status = 'APPROACHING_BREAKOUT';
  } else {
    status = 'IN_PATTERN';
  }

  return {
    currentPrice,
    breakoutLevel: upperLevel,
    supportLevel: lowerLevel,
    proximityPercent,
    status,
    volumeMultiplier,
    hasVolumeSurge,
    smaVolume: Math.round(smaVolume),
    currentVolume,
  };
}

