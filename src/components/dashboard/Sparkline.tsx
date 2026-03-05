import { Signal, SIGNAL_COLORS } from '@/lib/signals';

export function Sparkline({ data, color, width = 100, height = 32 }: {
  data: number[];
  color: Signal;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) * 0.85;
  const max = Math.max(...data) * 1.1;
  const range = max - min || 1;
  const id = `sg-${color}-${Math.random().toString(36).slice(2, 6)}`;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;
  const c = SIGNAL_COLORS[color]?.bg || '#94a3b8';

  return (
    <svg width={width} height={height} className="block flex-shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.3} />
          <stop offset="100%" stopColor={c} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
