import { PatternResult } from '../types/market';
import { BreakoutAlert } from '../types/alerts';
import { fetchStockCandles } from './marketDataService';
import { analyzeStockCandles } from './patternEngine';

export class ScannerService {
  private watchlist: string[] = [
    'NVDA',
    'AAPL',
    'MSFT',
    'TSLA',
    'AMD',
    'GOOGL',
    'AMZN',
    'META',
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
  ];

  private activePatterns: Map<string, PatternResult> = new Map();
  private alerts: BreakoutAlert[] = [];
  private isScanning: boolean = false;
  private currentTimeframe: '1d' | '1h' | '15m' | '1wk' = '1d';
  private lastScanTimestamp: number | null = null;
  private scanIntervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Keep maximum 100 recent alerts
  }

  public getTimeframe(): string {
    return this.currentTimeframe;
  }

  public setTimeframe(tf: '1d' | '1h' | '15m' | '1wk'): void {
    this.currentTimeframe = tf;
  }

  public getWatchlist(): string[] {
    return [...this.watchlist];
  }

  public addSymbol(symbol: string): boolean {
    const formatted = symbol.trim().toUpperCase();
    if (!this.watchlist.includes(formatted)) {
      this.watchlist.push(formatted);
      return true;
    }
    return false;
  }

  public removeSymbol(symbol: string): boolean {
    const formatted = symbol.trim().toUpperCase();
    const idx = this.watchlist.indexOf(formatted);
    if (idx !== -1) {
      this.watchlist.splice(idx, 1);
      this.activePatterns.delete(formatted);
      return true;
    }
    return false;
  }

  public getActivePatterns(): PatternResult[] {
    return Array.from(this.activePatterns.values()).sort(
      (a, b) => a.proximityPercent - b.proximityPercent
    );
  }

  public getAlerts(): BreakoutAlert[] {
    return [...this.alerts].reverse();
  }

  public clearAlerts(): void {
    this.alerts = [];
  }

  public getStatus() {
    return {
      isScanning: this.isScanning,
      lastScanTimestamp: this.lastScanTimestamp,
      currentTimeframe: this.currentTimeframe,
      totalTracked: this.watchlist.length,
      activePatternsCount: this.activePatterns.size,
      alertsCount: this.alerts.length,
    };
  }

  /**
   * Scans all symbols in the watchlist.
   */
  public async scanAll(timeframe?: '1d' | '1h' | '15m' | '1wk'): Promise<{ scannedCount: number; patternsFound: number }> {
    if (timeframe) {
      this.currentTimeframe = timeframe;
    }
    const tf = this.currentTimeframe;

    if (this.isScanning) {
      console.log('[Scanner] Scan already in progress, skipping.');
      return { scannedCount: 0, patternsFound: this.activePatterns.size };
    }

    this.isScanning = true;
    console.log(`[Scanner] Starting scan across ${this.watchlist.length} symbols for timeframe [${tf}]...`);

    let foundCount = 0;

    try {
      for (const symbol of this.watchlist) {
        try {
          const candles = await fetchStockCandles(symbol, undefined, tf);
          const result = analyzeStockCandles(symbol, candles, tf);

          if (result.hasPattern && result.pattern) {
            this.activePatterns.set(symbol, result.pattern);
            foundCount++;
            this.evaluateAlert(result.pattern);
          } else {
            this.activePatterns.delete(symbol);
          }
        } catch (err: any) {
          console.warn(`[Scanner] Failed to analyze ${symbol}: ${err.message}`);
        }
      }

      this.lastScanTimestamp = Date.now();
      console.log(`[Scanner] Scan finished. ${foundCount} active pattern(s) identified.`);
    } finally {
      this.isScanning = false;
    }

    return { scannedCount: this.watchlist.length, patternsFound: foundCount };
  }

  /**
   * Evaluates pattern state and triggers alerts for breakout proximity or confirmation.
   */
  private evaluateAlert(pattern: PatternResult): void {
    let shouldAlert = false;
    let message = '';

    if (pattern.status === 'CONFIRMED_BREAKOUT') {
      shouldAlert = true;
      message = `🚀 Confirmed Breakout! ${pattern.symbol} broke above resistance $${pattern.breakoutLevel} with ${pattern.volumeMultiplier}x volume surge!`;
    } else if (pattern.status === 'CONFIRMED_BREAKDOWN') {
      shouldAlert = true;
      message = `⚠️ Confirmed Breakdown! ${pattern.symbol} broke below support $${pattern.supportLevel}.`;
    } else if (pattern.status === 'AT_BREAKOUT_LEVEL') {
      shouldAlert = true;
      message = `⚡ ${pattern.symbol} is right at breakout resistance ($${pattern.breakoutLevel})! Proximity: ${pattern.proximityPercent}%.`;
    } else if (pattern.status === 'APPROACHING_BREAKOUT' && pattern.proximityPercent <= 1.5) {
      shouldAlert = true;
      message = `🔔 Early Alert: ${pattern.symbol} (${pattern.patternType}) is approaching breakout within ${pattern.proximityPercent}% ($${pattern.breakoutLevel}).`;
    }

    if (shouldAlert) {
      // Avoid duplicate alert within last 15 minutes for the same symbol & status
      const recentDup = this.alerts.find(
        (a) =>
          a.symbol === pattern.symbol &&
          a.status === pattern.status &&
          Date.now() - a.timestamp < 15 * 60 * 1000
      );

      if (!recentDup) {
        const newAlert: BreakoutAlert = {
          id: `alert_${pattern.symbol}_${Date.now()}`,
          symbol: pattern.symbol,
          patternType: pattern.patternType,
          price: pattern.currentPrice,
          breakoutLevel: pattern.breakoutLevel,
          proximityPercent: pattern.proximityPercent,
          volumeMultiplier: pattern.volumeMultiplier,
          status: pattern.status,
          timestamp: Date.now(),
          message,
        };

        this.alerts.push(newAlert);
        if (this.alerts.length > 100) {
          this.alerts.shift();
        }
        console.log(`[ALERT] ${message}`);
      }
    }
  }

  /**
   * Starts periodic background scanning.
   */
  public startPeriodicScan(intervalMinutes: number = 5): void {
    if (this.scanIntervalTimer) {
      clearInterval(this.scanIntervalTimer);
    }

    console.log(`[Scanner] Scheduled periodic scan every ${intervalMinutes} minute(s).`);
    // Run initial scan
    this.scanAll().catch(console.error);

    this.scanIntervalTimer = setInterval(() => {
      this.scanAll().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }

  public stopPeriodicScan(): void {
    if (this.scanIntervalTimer) {
      clearInterval(this.scanIntervalTimer);
      this.scanIntervalTimer = null;
    }
  }
}

// Export singleton instance
export const scannerService = new ScannerService();

