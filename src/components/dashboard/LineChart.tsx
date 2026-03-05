'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface ChangeMarker {
  date: string;
  change_type: string;
  before_value?: string;
  after_value?: string;
  note?: string;
}

export function LineChart({ data, title, formatValue, color = '#6366f1', campaignChanges = [] }: {
  data: DataPoint[];
  title: string;
  formatValue?: (v: number) => string;
  color?: string;
  campaignChanges?: ChangeMarker[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverChangeIdx, setHoverChangeIdx] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number>(0);
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

  // Map change markers to chart positions
  const changeMarkers = campaignChanges.map(change => {
    // Find the closest data point by matching MM-DD from the change date
    const changeDate = change.date.slice(5, 10); // Get MM-DD format
    const dataIdx = data.findIndex(d => d.label === changeDate);
    if (dataIdx === -1) return null;
    
    return {
      ...change,
      x: points[dataIdx]?.x || 0,
      y: padY + 10, // Position at top of chart
    };
  }).filter(Boolean) as (ChangeMarker & { x: number; y: number })[];

  // Handle mouse move for x-axis hover interaction
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgRect = event.currentTarget.querySelector('svg')?.getBoundingClientRect();
    if (!svgRect) return;

    const mouseXRelative = event.clientX - svgRect.left;
    const scaleX = W / svgRect.width;
    const actualMouseX = mouseXRelative * scaleX;
    
    setMouseX(actualMouseX);
    
    // Find closest data point by x position
    let closestIdx = 0;
    let minDistance = Math.abs(points[0].x - actualMouseX);
    
    for (let i = 1; i < points.length; i++) {
      const distance = Math.abs(points[i].x - actualMouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = i;
      }
    }
    
    setHoverIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
    setHoverChangeIdx(null);
  };

  return (
    <div className="rounded-2xl border border-slate-700/15 bg-slate-900/60 p-4 sm:p-5">
      <h4 className="text-sm font-bold text-slate-300 mb-3">{title}</h4>
      <div onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
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

        {/* Vertical hover line */}
        {hoverIdx !== null && (
          <line 
            x1={points[hoverIdx].x} 
            y1={padY} 
            x2={points[hoverIdx].x} 
            y2={padY + chartH} 
            stroke="rgba(148,163,184,0.3)" 
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        )}

        {/* Data points and labels */}
        {points.map((p, i) => (
          <g key={i}>
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

        {/* Change markers (orange flags) */}
        {changeMarkers.map((marker, i) => (
          <g 
            key={i} 
            onMouseEnter={() => setHoverChangeIdx(i)} 
            onMouseLeave={() => setHoverChangeIdx(null)}
            className="cursor-help"
          >
            {/* Flag pole */}
            <line x1={marker.x} y1={marker.y} x2={marker.x} y2={marker.y + 20} stroke="#f97316" strokeWidth={2} />
            
            {/* Flag */}
            <path 
              d={`M ${marker.x} ${marker.y} L ${marker.x + 12} ${marker.y + 4} L ${marker.x + 12} ${marker.y + 12} L ${marker.x} ${marker.y + 16} Z`} 
              fill="#f97316" 
              opacity={hoverChangeIdx === i ? 1 : 0.8}
            />
            
            {/* Hover tooltip */}
            {hoverChangeIdx === i && (
              <>
                <rect 
                  x={marker.x - 80} 
                  y={marker.y - 50} 
                  width={160} 
                  height={40} 
                  rx={6} 
                  fill="rgba(15,23,42,0.95)" 
                  stroke="#f97316" 
                  strokeWidth={1} 
                />
                <text x={marker.x} y={marker.y - 32} textAnchor="middle" fill="#f97316" fontSize={10} fontWeight="bold">
                  {marker.change_type}
                </text>
                <text x={marker.x} y={marker.y - 20} textAnchor="middle" fill="white" fontSize={9}>
                  {marker.before_value && marker.after_value ? 
                    `${marker.before_value} → ${marker.after_value}` : 
                    marker.note || 'Ver detalles'}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      </div>
    </div>
  );
}
