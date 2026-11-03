'use client';

import React from 'react';
import { PatternResult } from '../types';
import { TrendingUp, TrendingDown, Minus, Flame, Eye, ShieldCheck, Clock } from 'lucide-react';

interface PatternCardProps {
  pattern: PatternResult;
  onSelect: (pattern: PatternResult) => void;
}

export default function PatternCard({ pattern, onSelect }: PatternCardProps) {
  const getPatternBadge = (type: string) => {
    switch (type) {
      case 'ASCENDING_TRIANGLE':
        return { label: 'Ascending Triangle', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'DESCENDING_TRIANGLE':
        return { label: 'Descending Triangle', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'SYMMETRICAL_TRIANGLE':
        return { label: 'Symmetrical Triangle', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'BOX_PATTERN':
        return { label: 'Box / Darvas Pattern', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      default:
        return { label: type, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED_BREAKOUT':
        return { label: '🚀 Confirmed Breakout', color: 'bg-emerald-500 text-slate-950 font-bold' };
      case 'AT_BREAKOUT_LEVEL':
        return { label: '⚡ At Breakout Point', color: 'bg-sky-500 text-slate-950 font-semibold' };
      case 'APPROACHING_BREAKOUT':
        return { label: '🔔 Approaching Breakout', color: 'bg-amber-500 text-slate-950 font-medium' };
      case 'CONFIRMED_BREAKDOWN':
        return { label: '⚠️ Breakdown', color: 'bg-rose-500 text-white font-bold' };
      default:
        return { label: 'In Formation', color: 'bg-slate-800 text-slate-400' };
    }
  };

  const pBadge = getPatternBadge(pattern.patternType);
  const sBadge = getStatusBadge(pattern.status);

  return (
    <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 hover:border-indigo-500/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">{pattern.symbol}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pBadge.color}`}>
              {pBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Detected {new Date(pattern.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <span className={`text-[11px] px-2.5 py-1 rounded-full ${sBadge.color}`}>
          {sBadge.label}
        </span>
      </div>

      {/* Price & Breakout Grid */}
      <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Current Price</span>
          <div className="text-lg font-bold text-slate-100">${pattern.currentPrice.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Breakout Level</span>
          <div className="text-lg font-bold text-sky-400">${pattern.breakoutLevel.toFixed(2)}</div>
        </div>
      </div>

      {/* Proximity Gauge */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-400">Proximity to Breakout:</span>
          <span className={pattern.proximityPercent <= 1.0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {pattern.proximityPercent.toFixed(2)}% away
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pattern.proximityPercent <= 0.5
                ? 'bg-emerald-500'
                : pattern.proximityPercent <= 1.5
                ? 'bg-amber-400'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.max(10, Math.min(100, 100 - pattern.proximityPercent * 20))}%` }}
          />
        </div>
      </div>

      {/* Badges / Volume & Confidence */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mb-4">
        <div className="flex items-center gap-1.5">
          {pattern.hasVolumeSurge ? (
            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              {pattern.volumeMultiplier}x Vol Surge
            </span>
          ) : (
            <span className="text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-md">
              {pattern.volumeMultiplier}x Volume
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>{pattern.confidenceScore}% Fit</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSelect(pattern)}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
      >
        <Eye className="w-4 h-4" />
        Inspect Live Chart & Overlays
      </button>
    </div>
  );
}

