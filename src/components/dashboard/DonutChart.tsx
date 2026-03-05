'use client';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: Slice[];
  size?: number;
  label?: string;
}

export function DonutChart({ slices, size = 140, label }: DonutChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return null;

  const r = size / 2;
  const strokeWidth = size * 0.18;
  const radius = r - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <div className="text-xs font-bold text-slate-400">{label}</div>}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((sl, i) => {
            const pct = sl.value / total;
            const dashLength = pct * circumference;
            const dashOffset = -cumulative * circumference;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={sl.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${r} ${r})`}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-slate-300">{total.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((sl, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-[11px] text-slate-400">
              {sl.label} <span className="text-slate-500">{total > 0 ? ((sl.value / total) * 100).toFixed(0) : 0}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
