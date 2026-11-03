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
  slope: number;
  intercept: number;
  rSquared: number;
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
  proximityPercent: number;
  status: BreakoutStatus;
  volumeMultiplier: number;
  hasVolumeSurge: boolean;
  confidenceScore: number;
  upperTouches: Pivot[];
  lowerTouches: Pivot[];
  apexIndex?: number;
  apexTime?: number;
  detectedAt: number;
}

export interface BreakoutAlert {
  id: string;
  symbol: string;
  patternType: PatternType;
  price: number;
  breakoutLevel: number;
  proximityPercent: number;
  volumeMultiplier: number;
  status: BreakoutStatus;
  timestamp: number;
  message: string;
}

export interface ScannerStatus {
  isScanning: boolean;
  lastScanTimestamp: number | null;
  totalTracked: number;
  activePatternsCount: number;
  alertsCount: number;
}

