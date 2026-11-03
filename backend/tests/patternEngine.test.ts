import { Candle } from '../src/types/market';
import { analyzeStockCandles } from '../src/services/patternEngine';
import { findPivots } from '../src/services/pivotDetector';

describe('Pattern Engine Unit Tests', () => {
  /**
   * Helper to generate a synthetic Ascending Triangle:
   * Resistance is flat at 100.
   * Swing lows start at 80 and rise linearly: 80 -> 86 -> 92 -> 96.
   * Price bounces between rising lows and flat resistance.
   */
  function generateAscendingTriangle(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 8) * Math.PI); // oscillating wave
      const supportSlope = 80 + (i / count) * 16; // rises from 80 to 96
      const resistance = 100; // flat resistance at 100

      // interpolate price within rising support and flat resistance
      const normalizedWave = (cycle + 1) / 2; // 0 to 1
      const price = supportSlope + normalizedWave * (resistance - supportSlope);

      candles.push({
        time: baseTime + i * 86400,
        open: price - 0.5,
        high: Math.min(price + 1.0, resistance + 0.1),
        low: Math.max(price - 1.0, supportSlope - 0.1),
        close: price,
        volume: 1000000 + Math.floor(Math.sin(i) * 200000),
      });
    }

    return candles;
  }

  /**
   * Helper to generate a synthetic Box / Rectangle Pattern:
   * Support is flat around 50.
   * Resistance is flat around 60.
   */
  function generateBoxPattern(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 6) * Math.PI);
      const normalizedWave = (cycle + 1) / 2; // 0 to 1
      const price = 50 + normalizedWave * 10; // oscillates between 50 and 60

      candles.push({
        time: baseTime + i * 86400,
        open: price - 0.3,
        high: price + 0.8,
        low: price - 0.8,
        close: price,
        volume: 500000,
      });
    }

    return candles;
  }

  test('should detect swing pivot highs and lows', () => {
    const candles = generateAscendingTriangle();
    const { highs, lows } = findPivots(candles, 3);

    expect(highs.length).toBeGreaterThanOrEqual(2);
    expect(lows.length).toBeGreaterThanOrEqual(2);

    // Highs should be clustered near resistance (100)
    for (const h of highs) {
      expect(h.price).toBeGreaterThan(95);
    }
  });

  test('should correctly classify an Ascending Triangle', () => {
    const candles = generateAscendingTriangle();
    const result = analyzeStockCandles('TEST_ASC', candles);

    expect(result.hasPattern).toBe(true);
    expect(result.pattern).not.toBeNull();
    expect(result.pattern?.patternType).toBe('ASCENDING_TRIANGLE');
    expect(result.pattern?.direction).toBe('BULLISH');
    expect(result.pattern?.breakoutLevel).toBeCloseTo(100, 0);
  });

  test('should correctly classify a Box Pattern', () => {
    const candles = generateBoxPattern();
    const result = analyzeStockCandles('TEST_BOX', candles);

    expect(result.hasPattern).toBe(true);
    expect(result.pattern).not.toBeNull();
    expect(result.pattern?.patternType).toBe('BOX_PATTERN');
    expect(result.pattern?.breakoutLevel).toBeGreaterThan(58);
    expect(result.pattern?.supportLevel).toBeLessThan(52);
  });
});

