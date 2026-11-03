'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ListFilter, Check } from 'lucide-react';

interface WatchlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  onAdd: (symbol: string) => Promise<boolean>;
  onRemove: (symbol: string) => Promise<boolean>;
}

export default function WatchlistManager({
  isOpen,
  onClose,
  watchlist,
  onAdd,
  onRemove,
}: WatchlistManagerProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    const formatted = newSymbol.trim().toUpperCase();
    const success = await onAdd(formatted);

    if (success) {
      setNewSymbol('');
    } else {
      setErrorMsg(`${formatted} is already in the watchlist or invalid`);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Manage Scanner Watchlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Ticker Form */}
        <form onSubmit={handleAdd} className="mt-5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Add Stock Ticker Symbol
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. NVDA, TSLA, RELIANCE.NS, BTC-USD"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase font-mono"
            />
            <button
              type="submit"
              disabled={submitting || !newSymbol.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          {errorMsg && <p className="text-xs text-rose-400 mt-2">{errorMsg}</p>}
        </form>

        {/* Monitored Tickers List */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Currently Monitored ({watchlist.length})
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {watchlist.map((sym) => (
              <div
                key={sym}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <span className="font-bold text-white font-mono text-sm tracking-wide">{sym}</span>
                <button
                  onClick={() => onRemove(sym)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title={`Remove ${sym}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

