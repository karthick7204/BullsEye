import { Router, Request, Response } from 'express';
import { scannerService } from '../services/scannerService';
import { fetchStockCandles } from '../services/marketDataService';
import { analyzeStockCandles } from '../services/patternEngine';

const router = Router();

/**
 * GET /api/patterns/active
 * Returns all currently detected patterns across the monitored watchlist.
 */
router.get('/active', (_req: Request, res: Response) => {
  const activePatterns = scannerService.getActivePatterns();
  res.json({
    count: activePatterns.length,
    patterns: activePatterns,
  });
});

/**
 * GET /api/patterns/scan/:symbol
 * On-demand scan of a specific stock ticker.
 * Returns the detected pattern, trendline coordinates, breakout level, and candles for chart drawing.
 */
router.get('/scan/:symbol', async (req: Request, res: Response): Promise<any> => {
  const symbol = String(req.params.symbol || '');
  const period = (req.query.period as string) || '6mo';
  const interval = (req.query.interval as '1d' | '1h' | '15m' | '5m') || '1d';

  try {
    const candles = await fetchStockCandles(symbol, period, interval);
    const scanResult = analyzeStockCandles(symbol.toUpperCase(), candles);

    return res.json({
      symbol: symbol.toUpperCase(),
      hasPattern: scanResult.hasPattern,
      pattern: scanResult.pattern,
      highPivotsCount: scanResult.highPivotsCount,
      lowPivotsCount: scanResult.lowPivotsCount,
      latestPrice: scanResult.latestPrice,
      candles,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: `Failed to scan pattern for ${symbol}`,
      details: error.message,
    });
  }
});

export default router;
