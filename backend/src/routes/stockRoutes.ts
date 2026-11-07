import { Router, Request, Response } from 'express';
import { fetchStockCandles } from '../services/marketDataService';

const router = Router();

/**
 * GET /api/stocks/:symbol/chart
 * Returns historical OHLCV candles formatted for TradingView Lightweight Charts.
 */
router.get('/:symbol/chart', async (req: Request, res: Response): Promise<any> => {
  const symbol = String(req.params.symbol || '');
  const period = req.query.period as string;
  const interval = (req.query.interval || req.query.timeframe || '1d') as any;

  try {
    const candles = await fetchStockCandles(symbol, period, interval);
    return res.json({
      symbol: symbol.toUpperCase(),
      timeframe: interval,
      count: candles.length,
      candles,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: `Failed to fetch chart data for ${symbol}`,
      details: error.message,
    });
  }
});

export default router;
