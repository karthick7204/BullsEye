import { Router, Request, Response } from 'express';
import { scannerService } from '../services/scannerService';

const router = Router();

/**
 * GET /api/scanner/status
 * Returns current scanner running status, last scan timestamp, and watchlist size.
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json(scannerService.getStatus());
});

/**
 * POST /api/scanner/run
 * Manually triggers a scan across all watchlist stocks.
 */
router.post('/run', async (req: Request, res: Response) => {
  const timeframe = (req.body?.timeframe || req.query?.timeframe) as any;
  // Trigger scan asynchronously and return response immediately
  scannerService.scanAll(timeframe).catch((err) => {
    console.error('[Scanner] Manual scan error:', err);
  });

  res.json({
    message: `Scanner triggered successfully for timeframe ${timeframe || scannerService.getTimeframe()}`,
    timeframe: timeframe || scannerService.getTimeframe(),
    timestamp: Date.now(),
  });
});

/**
 * POST /api/scanner/timeframe
 * Updates active scanning timeframe.
 */
router.post('/timeframe', (req: Request, res: Response): any => {
  const { timeframe } = req.body;
  if (!timeframe || !['15m', '1h', '1d', '1wk'].includes(timeframe)) {
    return res.status(400).json({ error: 'Valid timeframe (15m, 1h, 1d, 1wk) required' });
  }

  scannerService.setTimeframe(timeframe);
  scannerService.scanAll(timeframe).catch(console.error);

  return res.json({
    message: `Active timeframe set to ${timeframe}`,
    timeframe,
  });
});

/**
 * GET /api/scanner/watchlist
 * Returns the list of tracked stock tickers.
 */
router.get('/watchlist', (_req: Request, res: Response) => {
  res.json({
    watchlist: scannerService.getWatchlist(),
  });
});

/**
 * POST /api/scanner/watchlist
 * Adds a new ticker to the scanner watchlist.
 */
router.post('/watchlist', (req: Request, res: Response): any => {
  const { symbol } = req.body;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Valid symbol string required' });
  }

  const added = scannerService.addSymbol(symbol);
  if (!added) {
    return res.status(409).json({ message: `${symbol.toUpperCase()} already in watchlist` });
  }

  return res.status(201).json({
    message: `Added ${symbol.toUpperCase()} to watchlist`,
    watchlist: scannerService.getWatchlist(),
  });
});

/**
 * DELETE /api/scanner/watchlist/:symbol
 * Removes a ticker from the scanner watchlist.
 */
router.delete('/watchlist/:symbol', (req: Request, res: Response): any => {
  const symbol = String(req.params.symbol || '');
  const removed = scannerService.removeSymbol(symbol);

  if (!removed) {
    return res.status(404).json({ error: `${symbol.toUpperCase()} not found in watchlist` });
  }

  return res.json({
    message: `Removed ${symbol.toUpperCase()} from watchlist`,
    watchlist: scannerService.getWatchlist(),
  });
});

export default router;
