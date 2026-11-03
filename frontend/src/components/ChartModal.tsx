'use client';

import React, { useEffect, useState } from 'react';
import { PatternResult, Candle } from '../types';
import LightweightChart from './LightweightChart';
import { getStockChart } from '../lib/api';
import { X, TrendingUp, BarChart2, Shield, Flame, Activity } from 'lucide-react';

interface ChartModalProps {
  pattern: PatternResult | null;
  onClose: () => void;
}

export default function ChartModal({ pattern, onClose }: ChartModalProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!pattern) return;

    let isMounted = true;
    setLoading(true);

    getStockChart(pattern.symbol)
      .then((data) => {
        if (isMounted) {
          setCandles(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load chart candles:', err);
        if (isMounted) setLoading(false);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pattern, onClose]);

  if (!pattern) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl sm:text-3xl font-black text-white">{pattern.symbol}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {pattern.patternType.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              {pattern.status.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Current Price</span>
              <div className="text-2xl font-black text-white mt-1">${pattern.currentPrice.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-sky-400 uppercase tracking-wider font-medium">Breakout Target</span>
              <div className="text-2xl font-black text-sky-400 mt-1">${pattern.breakoutLevel.toFixed(2)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-amber-400 uppercase tracking-wider font-medium">Proximity %</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{pattern.proximityPercent.toFixed(2)}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <span className="text-xs text-rose-400 uppercase tracking-wider font-medium">Volume Surge</span>
              <div className="text-2xl font-black text-rose-400 mt-1 flex items-center gap-1">
                {pattern.volumeMultiplier}x
                {pattern.hasVolumeSurge && <Flame className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />}
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="relative min-h-[480px] w-full">
            {loading ? (
              <div className="w-full h-[480px] rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-sm text-slate-400">Loading chart candles and overlays...</span>
                </div>
              </div>
            ) : (
              <LightweightChart candles={candles} pattern={pattern} height={480} />
            )}
          </div>

          {/* Technical Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Upper Resistance Line</span>
              <div>Slope: <span className="font-mono text-white">{pattern.upperLine.slope.toFixed(4)}</span></div>
              <div>R² Fit: <span className="font-mono text-white">{(pattern.upperLine.rSquared * 100).toFixed(1)}%</span></div>
              <div>Touches: <span className="font-mono text-rose-400">{pattern.upperTouches.length} peaks</span></div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Lower Support Line</span>
              <div>Slope: <span className="font-mono text-white">{pattern.lowerLine.slope.toFixed(4)}</span></div>
              <div>R² Fit: <span className="font-mono text-white">{(pattern.lowerLine.rSquared * 100).toFixed(1)}%</span></div>
              <div>Touches: <span className="font-mono text-emerald-400">{pattern.lowerTouches.length} troughs</span></div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">Pattern Geometry</span>
              <div>Pattern Fit: <span className="font-mono text-indigo-400 font-bold">{pattern.confidenceScore}%</span></div>
              <div>Breakout Bias: <span className="font-mono text-white uppercase">{pattern.direction}</span></div>
              <div>Support Floor: <span className="font-mono text-emerald-400">${pattern.supportLevel.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

