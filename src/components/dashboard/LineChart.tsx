'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

export function LineChart({ data, title, formatValue, color = '#6366f1' }: {
  data: DataPoint[];
  title: string;
  formatValue?: (v: number) => string;
  color?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (!data.length) return null;

  const fmt = formatValue || ((v: number) => v.toFixed(2));
  const values = data.map(d => d.value);
  const max = Math.max(...values, 0.01);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const W = 600;
  const H = 200;
  const padX = 50;
  const padY = 30;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2),
    y: padY + chartH - ((d.value - min) / range) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  // Y-axis labels
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => min + (range / yTicks) * i);

  return (
    <div className="rounded-2xl border border-slate-700/15 bg-slate-900/60 p-4 sm:p-5">
      <h4 className="text-sm font-bold text-slate-300 mb-3">{title}</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
        {/* Grid lines */}
        {yLabels.map((v, i) => {
          const y = padY + chartH - ((v - min) / range) * chartH;
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(148,163,184,0.1)" strokeWidth={1} />
              <text x={padX - 8} y={y + 4} textAnchor="end" fill="rgba(148,163,184,0.5)" fontSize={10}>
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`${color}15`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points and labels */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3} fill={color} opacity={hoverIdx === i ? 1 : 0.8} className="transition-all" />
            {/* X labels */}
            {(data.length <= 14 || i % Math.ceil(data.length / 10) === 0) && (
              <text x={p.x} y={H - 5} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize={9}>
                {data[i].label}
              </text>
            )}
            {/* Hover tooltip */}
            {hoverIdx === i && (
              <>
                <rect x={p.x - 35} y={p.y - 28} width={70} height={22} rx={6} fill="rgba(15,23,42,0.9)" stroke={color} strokeWidth={1} />
                <text x={p.x} y={p.y - 14} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">
                  {fmt(data[i].value)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
