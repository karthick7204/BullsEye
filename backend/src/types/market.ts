export interface Candle {
  time: number; // Unix timestamp in seconds
  dateStr?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Pivot {
  index: number;
  time: number;
  price: number;
  type: 'HIGH' | 'LOW';
}

export interface Trendline {
  slope: number;       // Price change per candle index
  intercept: number;   // Base price at index 0
  rSquared: number;    // Line fit confidence (0 to 1)
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
}

export type PatternType =
  | 'ASCENDING_TRIANGLE'
  | 'DESCENDING_TRIANGLE'
  | 'SYMMETRICAL_TRIANGLE'
  | 'BOX_PATTERN';

export type BreakoutDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type BreakoutStatus =
  | 'IN_PATTERN'
  | 'APPROACHING_BREAKOUT'
  | 'AT_BREAKOUT_LEVEL'
  | 'CONFIRMED_BREAKOUT'
  | 'CONFIRMED_BREAKDOWN';

export interface PatternResult {
  id: string;
  symbol: string;
  patternType: PatternType;
  direction: BreakoutDirection;
  upperLine: Trendline;
  lowerLine: Trendline;
  breakoutLevel: number;
  supportLevel: number;
  currentPrice: number;
  proximityPercent: number; // e.g. 0.8% away
  status: BreakoutStatus;
  volumeMultiplier: number; // Current volume / 20 SMA volume
  hasVolumeSurge: boolean; // >= 1.5x
  confidenceScore: number; // 0-100 score
  upperTouches: Pivot[];
  lowerTouches: Pivot[];
  apexIndex?: number;
  apexTime?: number;
  detectedAt: number;
}

