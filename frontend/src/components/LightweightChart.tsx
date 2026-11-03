'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Candle, PatternResult } from '../types';

interface LightweightChartProps {
  candles: Candle[];
  pattern?: PatternResult | null;
  height?: number;
}

export default function LightweightChart({
  candles,
  pattern,
  height = 480,
}: LightweightChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Padding
    const padTop = 30;
    const padBottom = 60;
    const padLeft = 10;
    const padRight = 65;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    // Price scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    if (pattern) {
      minPrice = Math.min(minPrice, pattern.lowerLine.startPrice, pattern.lowerLine.endPrice, pattern.supportLevel);
      maxPrice = Math.max(maxPrice, pattern.upperLine.startPrice, pattern.upperLine.endPrice, pattern.breakoutLevel);
    }

    // Add 2% margin to price bounds
    const pMargin = (maxPrice - minPrice) * 0.05 || 1.0;
    minPrice -= pMargin;
    maxPrice += pMargin;
    const pRange = maxPrice - minPrice;

    const getY = (price: number) => {
      return padTop + (1 - (price - minPrice) / pRange) * chartH;
    };

    const count = candles.length;
    const candleSpacing = chartW / count;
    const candleW = Math.max(2, Math.min(12, candleSpacing * 0.7));

    const getX = (idx: number) => {
      return padLeft + idx * candleSpacing + candleSpacing / 2;
    };

    // 1. Draw Background & Grid
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const gY = padTop + (i / gridSteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, gY);
      ctx.lineTo(width - padRight, gY);
      ctx.stroke();

      // Price labels
      const gPrice = maxPrice - (i / gridSteps) * pRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`$${gPrice.toFixed(2)}`, width - padRight + 6, gY + 4);
    }

    // 2. Draw Volume Bars (Bottom 25% of chart)
    const volMaxH = chartH * 0.22;
    for (let i = 0; i < count; i++) {
      const c = candles[i];
      const x = getX(i);
      const vH = (c.volume / (maxVol || 1)) * volMaxH;
      const vY = padTop + chartH - vH;

      ctx.fillStyle = c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(x - candleW / 2, vY, candleW, vH);
    }

    // 3. Draw Candlesticks
    for (let i = 0; i < count; i++) {
      const c = candles[i];
      const x = getX(i);
      const isUp = c.close >= c.open;
      const col = isUp ? '#10b981' : '#ef4444';

      const highY = getY(c.high);
      const lowY = getY(c.low);
      const openY = getY(c.open);
      const closeY = getY(c.close);

      // Wick
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = col;
      const bodyY = Math.min(openY, closeY);
      const bodyH = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillRect(x - candleW / 2, bodyY, candleW, bodyH);
    }

    // 4. Auto-draw Pattern Trendlines & Levels
    if (pattern) {
      const startIndex = Math.max(0, pattern.upperLine.startIndex);
      const endIndex = Math.min(count - 1, pattern.upperLine.endIndex);

      const startX = getX(startIndex);
      const endX = getX(endIndex);

      const upperStartY = getY(pattern.upperLine.startPrice);
      const upperEndY = getY(pattern.upperLine.endPrice);

      const lowerStartY = getY(pattern.lowerLine.startPrice);
      const lowerEndY = getY(pattern.lowerLine.endPrice);

      // Upper Resistance Line (Red)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startX, upperStartY);
      ctx.lineTo(endX, upperEndY);
      ctx.stroke();

      // Lower Support Line (Green)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, lowerStartY);
      ctx.lineTo(endX, lowerEndY);
      ctx.stroke();

      // Breakout Level Line (Dashed Sky/Cyan)
      const breakoutY = getY(pattern.breakoutLevel);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, breakoutY);
      ctx.lineTo(width - padRight, breakoutY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label at end of breakout line
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`BREAKOUT $${pattern.breakoutLevel.toFixed(2)}`, width - padRight + 6, breakoutY - 4);

      // Pivot Touch Highlights
      const highlightPivots = (pivots: typeof pattern.upperTouches, color: string, isAbove: boolean) => {
        for (const p of pivots) {
          const px = getX(p.index);
          const py = getY(p.price);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, isAbove ? py - 8 : py + 8, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      highlightPivots(pattern.upperTouches, '#f43f5e', true);
      highlightPivots(pattern.lowerTouches, '#10b981', false);
    }

    // 5. Crosshair on Mouse Hover
    if (mousePos) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padTop);
      ctx.lineTo(mousePos.x, height - padBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, mousePos.y);
      ctx.lineTo(width - padRight, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Time labels on X-axis
    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const xStep = Math.max(1, Math.floor(count / 7));
    for (let i = 0; i < count; i += xStep) {
      const c = candles[i];
      const x = getX(i);
      ctx.fillText(c.dateStr || '', x, height - padBottom + 18);
    }
  }, [candles, pattern, height, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const padLeft = 10;
    const padRight = 65;
    const chartW = canvas.clientWidth - padLeft - padRight;
    const count = candles.length;
    const candleSpacing = chartW / count;

    const idx = Math.floor((x - padLeft) / candleSpacing);
    if (idx >= 0 && idx < count) {
      setHoveredCandle(candles[idx]);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
  };

  const activeCandle = hoveredCandle || candles[candles.length - 1];

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0d1117] shadow-2xl">
      {/* Live HUD Header */}
      {activeCandle && (
        <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400">{activeCandle.dateStr}</span>
          <span>O: <strong className="text-white">${activeCandle.open.toFixed(2)}</strong></span>
          <span>H: <strong className="text-white">${activeCandle.high.toFixed(2)}</strong></span>
          <span>L: <strong className="text-white">${activeCandle.low.toFixed(2)}</strong></span>
          <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${activeCandle.close.toFixed(2)}</strong></span>
          <span>Vol: <strong className="text-sky-400">{(activeCandle.volume / 1e6).toFixed(1)}M</strong></span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full cursor-crosshair block"
      />
    </div>
  );
}
