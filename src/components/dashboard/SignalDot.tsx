import { Signal, SIGNAL_COLORS } from '@/lib/signals';

export function SignalDot({ color, size = 10 }: { color: Signal; size?: number }) {
  const s = SIGNAL_COLORS[color];
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: s.bg,
        boxShadow: `0 0 ${size}px ${s.glow}`,
      }}
    />
  );
}
