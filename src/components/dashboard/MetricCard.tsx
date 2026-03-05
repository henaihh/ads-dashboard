import { Signal, SIGNAL_COLORS, getSignalLabel } from '@/lib/signals';
import { SignalDot } from './SignalDot';
import { Sparkline } from './Sparkline';

export function MetricCard({ label, value, suffix = '', signal, spark, small }: {
  label: string;
  value: string | number;
  suffix?: string;
  signal: Signal;
  spark?: number[];
  small?: boolean;
}) {
  const s = SIGNAL_COLORS[signal];

  return (
    <div
      className="rounded-xl border backdrop-blur-sm transition-colors"
      style={{
        background: 'rgba(15,23,42,0.6)',
        borderColor: `${s.bg}22`,
        padding: small ? '12px 14px' : '16px 18px',
      }}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <SignalDot color={signal} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={`font-bold text-slate-100 tracking-tight ${small ? 'text-xl' : 'text-2xl'}`}>
          {value}
          {suffix && <span className="text-sm font-normal text-slate-400">{suffix}</span>}
        </span>
        {spark && <Sparkline data={spark} color={signal} width={small ? 64 : 80} height={small ? 24 : 28} />}
      </div>
      {signal !== 'gray' && (
        <span className={`inline-block text-[10px] font-semibold mt-1.5 px-2 py-0.5 rounded-md ${s.pill}`}>
          {getSignalLabel(signal)}
        </span>
      )}
    </div>
  );
}
