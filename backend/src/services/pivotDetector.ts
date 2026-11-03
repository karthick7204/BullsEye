import { Candle, Pivot } from '../types/market';

/**
 * Detects local swing highs and swing lows (extrema) across a candlestick array.
 * @param candles Historical OHLCV candles
 * @param order Window radius on each side (default: 4 candles left and right)
 */
export function findPivots(
  candles: Candle[],
  order: number = 4
): { highs: Pivot[]; lows: Pivot[] } {
  const highs: Pivot[] = [];
  const lows: Pivot[] = [];

  if (candles.length < order * 2 + 1) {
    return { highs, lows };
  }

  for (let i = order; i < candles.length - order; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - order; j <= i + order; j++) {
      if (j === i) continue;
      // Strict peak or tie-break with earlier candle to handle resistance plateaus
      if (candles[j].high > currentHigh || (candles[j].high === currentHigh && j < i)) {
        isHigh = false;
      }
      if (candles[j].low < currentLow || (candles[j].low === currentLow && j < i)) {
        isLow = false;
      }
    }

    if (isHigh) {
      highs.push({
        index: i,
        time: candles[i].time,
        price: currentHigh,
        type: 'HIGH',
      });
    }

    if (isLow) {
      lows.push({
        index: i,
        time: candles[i].time,
        price: currentLow,
        type: 'LOW',
      });
    }
  }

  // Filter out adjacent redundant pivots of the same type if too close (keep the most extreme)
  const filteredHighs = filterAdjacentPivots(highs, 'HIGH', order);
  const filteredLows = filterAdjacentPivots(lows, 'LOW', order);

  return { highs: filteredHighs, lows: filteredLows };
}

function filterAdjacentPivots(pivots: Pivot[], type: 'HIGH' | 'LOW', minDistance: number): Pivot[] {
  if (pivots.length <= 1) return pivots;

  const result: Pivot[] = [];
  let currentGroup: Pivot[] = [pivots[0]];

  for (let i = 1; i < pivots.length; i++) {
    const prev = pivots[i - 1];
    const curr = pivots[i];

    if (curr.index - prev.index <= minDistance) {
      currentGroup.push(curr);
    } else {
      // Pick best from group
      result.push(selectBestPivot(currentGroup, type));
      currentGroup = [curr];
    }
  }

  if (currentGroup.length > 0) {
    result.push(selectBestPivot(currentGroup, type));
  }

  return result;
}

function selectBestPivot(group: Pivot[], type: 'HIGH' | 'LOW'): Pivot {
  if (type === 'HIGH') {
    return group.reduce((max, p) => (p.price > max.price ? p : max), group[0]);
  } else {
    return group.reduce((min, p) => (p.price < min.price ? p : min), group[0]);
  }
}
