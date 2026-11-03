import { Router, Request, Response } from 'express';
import { scannerService } from '../services/scannerService';

const router = Router();

/**
 * GET /api/alerts
 * Returns the history of recent breakout proximity and breakout trigger alerts.
 */
router.get('/', (_req: Request, res: Response) => {
  const alerts = scannerService.getAlerts();
  res.json({
    count: alerts.length,
    alerts,
  });
});

/**
 * POST /api/alerts/clear
 * Clears the alert history.
 */
router.post('/clear', (_req: Request, res: Response) => {
  scannerService.clearAlerts();
  res.json({
    message: 'Alert history cleared',
  });
});

export default router;

