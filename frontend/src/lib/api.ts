import { PatternResult, Candle, BreakoutAlert, ScannerStatus } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export async function getActivePatterns(): Promise<PatternResult[]> {
  try {
    const res = await fetch(`${API_BASE}/patterns/active`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch active patterns');
    const data = await res.json();
    return data.patterns || [];
  } catch (error) {
    console.error('getActivePatterns error:', error);
    return [];
  }
}

export async function scanStock(symbol: string): Promise<{
  symbol: string;
  hasPattern: boolean;
  pattern: PatternResult | null;
  candles: Candle[];
  latestPrice: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/patterns/scan/${encodeURIComponent(symbol)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to scan stock ${symbol}`);
    return await res.json();
  } catch (error) {
    console.error(`scanStock error for ${symbol}:`, error);
    return null;
  }
}

export async function getStockChart(symbol: string): Promise<Candle[]> {
  try {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/chart`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Failed to fetch chart for ${symbol}`);
    const data = await res.json();
    return data.candles || [];
  } catch (error) {
    console.error(`getStockChart error for ${symbol}:`, error);
    return [];
  }
}

export async function getAlerts(): Promise<BreakoutAlert[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    const data = await res.json();
    return data.alerts || [];
  } catch (error) {
    console.error('getAlerts error:', error);
    return [];
  }
}

export async function clearAlerts(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/alerts/clear`, { method: 'POST' });
    return res.ok;
  } catch (error) {
    console.error('clearAlerts error:', error);
    return false;
  }
}

export async function getScannerStatus(): Promise<ScannerStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/scanner/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch scanner status');
    return await res.json();
  } catch (error) {
    console.error('getScannerStatus error:', error);
    return null;
  }
}

export async function triggerScannerRun(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scanner/run`, { method: 'POST' });
    return res.ok;
  } catch (error) {
    console.error('triggerScannerRun error:', error);
    return false;
  }
}

export async function getWatchlist(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/scanner/watchlist`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    const data = await res.json();
    return data.watchlist || [];
  } catch (error) {
    console.error('getWatchlist error:', error);
    return [];
  }
}

export async function addToWatchlist(symbol: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scanner/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    return res.ok;
  } catch (error) {
    console.error('addToWatchlist error:', error);
    return false;
  }
}

export async function removeFromWatchlist(symbol: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scanner/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error('removeFromWatchlist error:', error);
    return false;
  }
}

