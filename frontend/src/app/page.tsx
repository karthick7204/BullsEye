'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { PatternResult, BreakoutAlert, ScannerStatus } from '../types';
import {
  getActivePatterns,
  getAlerts,
  clearAlerts,
  getScannerStatus,
  triggerScannerRun,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  scanStock,
} from '../lib/api';
import PatternCard from '../components/PatternCard';
import ChartModal from '../components/ChartModal';
import AlertDrawer from '../components/AlertDrawer';
import WatchlistManager from '../components/WatchlistManager';
import {
  Target,
  RefreshCw,
  Bell,
  Search,
  Filter,
  ListFilter,
  Flame,
  Activity,
  Layers,
  TrendingUp,
  Zap,
} from 'lucide-react';

export default function Dashboard() {
  const [patterns, setPatterns] = useState<PatternResult[]>([]);
  const [alerts, setAlerts] = useState<BreakoutAlert[]>([]);
  const [status, setStatus] = useState<ScannerStatus | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatternType, setSelectedPatternType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PROXIMITY' | 'CONFIDENCE' | 'SYMBOL'>('PROXIMITY');

  // Modals & Panels
  const [selectedPattern, setSelectedPattern] = useState<PatternResult | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState<boolean>(false);

  // Initial Data Fetch
  const loadData = async () => {
    try {
      const [patList, alertList, stat, wl] = await Promise.all([
        getActivePatterns(),
        getAlerts(),
        getScannerStatus(),
        getWatchlist(),
      ]);
      setPatterns(patList);
      setAlerts(alertList);
      setStatus(stat);
      setWatchlist(wl);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 8 seconds for live alerts and scanner updates
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualScan = async () => {
    setRefreshing(true);
    await triggerScannerRun();
    // Re-fetch after 2.5 seconds
    setTimeout(async () => {
      await loadData();
      setRefreshing(false);
    }, 2500);
  };

  const handleSelectSymbolFromAlert = async (symbol: string) => {
    setIsAlertDrawerOpen(false);
    const existing = patterns.find((p) => p.symbol === symbol);
    if (existing) {
      setSelectedPattern(existing);
    } else {
      // On demand scan
      const res = await scanStock(symbol);
      if (res && res.pattern) {
        setSelectedPattern(res.pattern);
      }
    }
  };

  // Filter & Sort
  const filteredPatterns = useMemo(() => {
    return patterns
      .filter((p) => {
        const matchesQuery = p.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType =
          selectedPatternType === 'ALL' || p.patternType === selectedPatternType;
        return matchesQuery && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'PROXIMITY') return a.proximityPercent - b.proximityPercent;
        if (sortBy === 'CONFIDENCE') return b.confidenceScore - a.confidenceScore;
        return a.symbol.localeCompare(b.symbol);
      });
  }, [patterns, searchQuery, selectedPatternType, sortBy]);

  // Summary Metrics
  const approachingCount = patterns.filter((p) => p.proximityPercent <= 1.5).length;
  const surgeCount = patterns.filter((p) => p.hasVolumeSurge).length;
  const confirmedCount = patterns.filter((p) => p.status === 'CONFIRMED_BREAKOUT').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">BullsEye</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0 AUTO
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Monitoring {watchlist.length} Stocks</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsWatchlistOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Watchlist</span>
            </button>

            <button
              onClick={handleManualScan}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Scan</span>
            </button>

            <button
              onClick={() => setIsAlertDrawerOpen(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/25"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
              {alerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top KPI Metrics Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Formations</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white">{patterns.length}</div>
            <div className="text-xs text-slate-500 mt-1">Triangles & Box patterns</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Approaching Breakout</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">{approachingCount}</div>
            <div className="text-xs text-slate-500 mt-1">Within &lt; 1.5% of boundary</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Volume Surges</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-rose-400">{surgeCount}</div>
            <div className="text-xs text-slate-500 mt-1">&ge; 1.5x 20-period SMA</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Confirmed Breakouts</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{confirmedCount}</div>
            <div className="text-xs text-slate-500 mt-1">Closed outside pattern</div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker (e.g. NVDA, AAPL, RELIANCE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors uppercase font-mono"
            />
          </div>

          {/* Pattern Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Patterns' },
              { id: 'ASCENDING_TRIANGLE', label: 'Ascending' },
              { id: 'DESCENDING_TRIANGLE', label: 'Descending' },
              { id: 'SYMMETRICAL_TRIANGLE', label: 'Symmetrical' },
              { id: 'BOX_PATTERN', label: 'Box / Darvas' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatternType(p.id)}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                  selectedPatternType === p.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="PROXIMITY">Proximity (Closest)</option>
              <option value="CONFIDENCE">Confidence Fit</option>
              <option value="SYMBOL">Symbol (A-Z)</option>
            </select>
          </div>
        </section>

        {/* Detected Patterns Grid */}
        <section>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <p className="text-slate-400 font-semibold">Scanning stock market patterns...</p>
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="py-24 rounded-3xl bg-slate-950 border border-slate-800/80 flex flex-col items-center justify-center text-center p-8">
              <Layers className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-white">No Matching Patterns Found</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                Try switching filters or add new tickers to your watchlist to scan more opportunities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onSelect={(p) => setSelectedPattern(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals & Panels */}
      <ChartModal
        pattern={selectedPattern}
        onClose={() => setSelectedPattern(null)}
      />

      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onClear={() => {
          clearAlerts();
          setAlerts([]);
        }}
        onSelectSymbol={handleSelectSymbolFromAlert}
      />

      <WatchlistManager
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onAdd={async (sym) => {
          const ok = await addToWatchlist(sym);
          if (ok) {
            setWatchlist((prev) => [...prev, sym]);
            handleManualScan();
          }
          return ok;
        }}
        onRemove={async (sym) => {
          const ok = await removeFromWatchlist(sym);
          if (ok) {
            setWatchlist((prev) => prev.filter((s) => s !== sym));
            handleManualScan();
          }
          return ok;
        }}
      />
    </div>
  );
}

