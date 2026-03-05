'use client';

interface Bar {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  bars: Bar[];
  title: string;
  color?: string;
  suffix?: string;
  maxBars?: number;
}

export function HorizontalBarChart({ bars, title, color = '#6366f1', suffix = '', maxBars = 8 }: HorizontalBarChartProps) {
  const sorted = [...bars].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const max = Math.max(...sorted.map(b => b.value), 1);

  if (sorted.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-bold text-slate-400 mb-3">{title}</div>
      <div className="space-y-2">
        {sorted.map((bar, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-[72px] sm:w-[90px] text-[11px] text-slate-400 text-right truncate flex-shrink-0">
              {bar.label}
            </div>
            <div className="flex-1 h-5 bg-slate-800/50 rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${(bar.value / max) * 100}%`,
                  backgroundColor: color,
                  opacity: 1 - i * 0.08,
                }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-300">
                {typeof bar.value === 'number' && bar.value % 1 !== 0
                  ? bar.value.toFixed(1)
                  : bar.value.toLocaleString('es-AR')}
                {suffix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
