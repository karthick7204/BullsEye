import { PatternType, BreakoutStatus } from './market';

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

