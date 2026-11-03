'use client';

import React from 'react';
import { BreakoutAlert } from '../types';
import { Bell, X, Trash2, Flame, AlertCircle, ArrowUpRight } from 'lucide-react';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: BreakoutAlert[];
  onClear: () => void;
  onSelectSymbol: (symbol: string) => void;
}

export default function AlertDrawer({
  isOpen,
  onClose,
  alerts,
  onClear,
  onSelectSymbol,
}: AlertDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-5 h-5 text-indigo-400" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                )}
              </div>
              <h2 className="text-lg font-bold text-white">Breakout Alerts Feed</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                {alerts.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {alerts.length > 0 && (
                <button
                  onClick={onClear}
                  title="Clear alerts"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Alert List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Bell className="w-12 h-12 stroke-[1.5] mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">No active alerts</p>
                <p className="text-xs mt-1 max-w-xs">
                  Alerts will trigger automatically when a stock approaches within 1.5% of breakout or breaches resistance.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onSelectSymbol(alert.symbol)}
                  className="group p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-indigo-500/50 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-base font-black text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                      {alert.symbol}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                    </span>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                    <span>Target: ${alert.breakoutLevel.toFixed(2)}</span>
                    <span className={alert.proximityPercent <= 1.0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {alert.proximityPercent.toFixed(2)}% away
                    </span>
                    {alert.volumeMultiplier >= 1.5 && (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-rose-500" />
                        {alert.volumeMultiplier}x
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

