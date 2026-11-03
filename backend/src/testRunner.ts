import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import { Candle } from './types/market';
import { analyzeStockCandles } from './services/patternEngine';
import { findPivots } from './services/pivotDetector';

describe('BullsEye Pattern Engine Test Suite', () => {
  function generateAscendingTriangle(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 8) * Math.PI);
      const supportSlope = 80 + (i / count) * 16; // 80 -> 96
      const resistance = 100; // flat resistance at 100

      const normalizedWave = (cycle + 1) / 2;
      const price = supportSlope + normalizedWave * (resistance - supportSlope);

      candles.push({
        time: baseTime + i * 86400,
        open: Number((price - 0.4).toFixed(2)),
        high: Number(Math.min(price + 1.0, resistance + 0.1).toFixed(2)),
        low: Number(Math.max(price - 1.0, supportSlope - 0.1).toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: 1000000 + Math.floor(Math.sin(i) * 200000),
      });
    }

    return candles;
  }

  function generateDescendingTriangle(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 8) * Math.PI);
      const resistanceSlope = 120 - (i / count) * 16; // 120 -> 104
      const support = 100; // flat support at 100

      const normalizedWave = (cycle + 1) / 2;
      const price = support + normalizedWave * (resistanceSlope - support);

      candles.push({
        time: baseTime + i * 86400,
        open: Number((price - 0.4).toFixed(2)),
        high: Number(Math.min(price + 1.0, resistanceSlope + 0.1).toFixed(2)),
        low: Number(Math.max(price - 1.0, support - 0.1).toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: 1000000,
      });
    }

    return candles;
  }

  function generateSymmetricalTriangle(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 8) * Math.PI);
      const resistanceSlope = 120 - (i / count) * 15; // 120 -> 105
      const supportSlope = 80 + (i / count) * 15;    // 80 -> 95

      const normalizedWave = (cycle + 1) / 2;
      const price = supportSlope + normalizedWave * (resistanceSlope - supportSlope);

      candles.push({
        time: baseTime + i * 86400,
        open: Number((price - 0.4).toFixed(2)),
        high: Number((price + 1.0).toFixed(2)),
        low: Number((price - 1.0).toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: 1000000,
      });
    }

    return candles;
  }

  function generateBoxPattern(): Candle[] {
    const candles: Candle[] = [];
    const baseTime = 1700000000;
    const count = 60;

    for (let i = 0; i < count; i++) {
      const cycle = Math.sin((i / 6) * Math.PI);
      const normalizedWave = (cycle + 1) / 2;
      const price = 50 + normalizedWave * 10; // oscillates 50 to 60

      candles.push({
        time: baseTime + i * 86400,
        open: Number((price - 0.3).toFixed(2)),
        high: Number((price + 0.8).toFixed(2)),
        low: Number((price - 0.8).toFixed(2)),
        close: Number(price.toFixed(2)),
        volume: 500000,
      });
    }

    return candles;
  }

  it('detects swing pivot extrema accurately', () => {
    const candles = generateAscendingTriangle();
    const { highs, lows } = findPivots(candles, 3);

    assert(highs.length >= 2, `Expected at least 2 highs, got ${highs.length}`);
    assert(lows.length >= 2, `Expected at least 2 lows, got ${lows.length}`);

    for (const h of highs) {
      assert(h.price >= 95, `High price ${h.price} should be >= 95`);
    }
  });

  it('correctly detects and classifies an Ascending Triangle', () => {
    const candles = generateAscendingTriangle();
    const result = analyzeStockCandles('MOCK_ASC', candles);

    assert.strictEqual(result.hasPattern, true);
    assert.ok(result.pattern);
    assert.strictEqual(result.pattern.patternType, 'ASCENDING_TRIANGLE');
    assert.strictEqual(result.pattern.direction, 'BULLISH');
    assert(Math.abs(result.pattern.breakoutLevel - 100) < 3.0, `Breakout level ${result.pattern.breakoutLevel} expected near 100`);
    assert(result.pattern.proximityPercent >= 0, 'Proximity percent must be positive');
  });

  it('correctly detects and classifies a Descending Triangle', () => {
    const candles = generateDescendingTriangle();
    const result = analyzeStockCandles('MOCK_DESC', candles);

    assert.strictEqual(result.hasPattern, true);
    assert.ok(result.pattern);
    assert.strictEqual(result.pattern.patternType, 'DESCENDING_TRIANGLE');
    assert.strictEqual(result.pattern.direction, 'BEARISH');
    assert(Math.abs(result.pattern.supportLevel - 100) < 3.0, `Support level ${result.pattern.supportLevel} expected near 100`);
  });

  it('correctly detects and classifies a Symmetrical Triangle', () => {
    const candles = generateSymmetricalTriangle();
    const result = analyzeStockCandles('MOCK_SYM', candles);

    assert.strictEqual(result.hasPattern, true);
    assert.ok(result.pattern);
    assert.strictEqual(result.pattern.patternType, 'SYMMETRICAL_TRIANGLE');
    assert(result.pattern.breakoutLevel > result.pattern.supportLevel);
  });

  it('correctly detects and classifies a Box Pattern', () => {
    const candles = generateBoxPattern();
    const result = analyzeStockCandles('MOCK_BOX', candles);

    assert.strictEqual(result.hasPattern, true);
    assert.ok(result.pattern);
    assert.strictEqual(result.pattern.patternType, 'BOX_PATTERN');
    assert(result.pattern.breakoutLevel > 57, `Box upper bound ${result.pattern.breakoutLevel} expected > 57`);
    assert(result.pattern.supportLevel < 53, `Box lower bound ${result.pattern.supportLevel} expected < 53`);
  });

  it('measures proximity and flags approaching breakout', () => {
    const candles = generateAscendingTriangle();
    candles[candles.length - 1].close = 99.5;
    const result = analyzeStockCandles('MOCK_CLOSE', candles);

    assert.ok(result.pattern);
    assert(result.pattern.proximityPercent < 1.0, `Proximity ${result.pattern.proximityPercent}% should be < 1.0%`);
    assert(
      result.pattern.status === 'APPROACHING_BREAKOUT' || result.pattern.status === 'AT_BREAKOUT_LEVEL',
      `Expected status APPROACHING_BREAKOUT or AT_BREAKOUT_LEVEL, got ${result.pattern.status}`
    );
  });
});
