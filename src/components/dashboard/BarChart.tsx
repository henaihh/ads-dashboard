import { AdSet } from '@/lib/data';
import { getSignal, SIGNAL_COLORS } from '@/lib/signals';

export function BarChart({ items, valueKey, label, platform }: {
  items: AdSet[];
  valueKey: 'roas' | 'ctr';
  label: string;
  platform: string;
}) {
  const maxVal = Math.max(...items.map(i => i[valueKey]), 0.01);

  return (
    <div className="space-y-2">
      <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
      {items.map((item, i) => {
        const pct = (item[valueKey] / maxVal) * 100;
        const sig = getSignal(item[valueKey], valueKey, platform);
        const c = SIGNAL_COLORS[sig];

        return (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-xs text-slate-300 min-w-[100px] sm:min-w-[120px] truncate">{item.name}</span>
            <div className="flex-1 h-4 bg-slate-800/50 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c.bg}88, ${c.bg})`,
                }}
              />
            </div>
            <span className="text-xs font-semibold min-w-[50px] text-right" style={{ color: c.bg }}>
              {valueKey === 'roas' ? `${item[valueKey].toFixed(1)}x` : `${item[valueKey].toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
