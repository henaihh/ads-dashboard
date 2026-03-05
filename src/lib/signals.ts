export type Signal = 'green' | 'yellow' | 'red' | 'gray';

interface Threshold {
  great: number;
  ok: number;
  inverted?: boolean;
}

const META_THRESHOLDS: Record<string, Threshold> = {
  roas: { great: 4, ok: 2 },
  ctr: { great: 2.5, ok: 1.5 },
  cpc: { great: 0.3, ok: 0.6, inverted: true },
  frequency: { great: 1.5, ok: 2.5, inverted: true },
  cpm: { great: 6, ok: 12, inverted: true },
  costPerResult: { great: 10, ok: 25, inverted: true },
};

const MELI_THRESHOLDS: Record<string, Threshold> = {
  roas: { great: 8, ok: 3 },
  ctr: { great: 2.5, ok: 1.5 },
  cpc: { great: 5, ok: 10, inverted: true },
  frequency: { great: 1.5, ok: 2.5, inverted: true },
  cpm: { great: 100, ok: 180, inverted: true },
  costPerResult: { great: 200, ok: 500, inverted: true },
};

export function getSignal(value: number, metric: string, platform: string = 'meta'): Signal {
  const thresholds = platform === 'meli' ? MELI_THRESHOLDS : META_THRESHOLDS;
  const t = thresholds[metric];
  if (!t) return 'gray';

  if (t.inverted) {
    if (value <= t.great) return 'green';
    if (value <= t.ok) return 'yellow';
    return 'red';
  }
  if (value >= t.great) return 'green';
  if (value >= t.ok) return 'yellow';
  return 'red';
}

export function getSignalLabel(color: Signal): string {
  switch (color) {
    case 'green': return 'Excelente';
    case 'yellow': return 'Atención';
    case 'red': return 'Problema';
    default: return '';
  }
}

export const SIGNAL_COLORS: Record<Signal, { bg: string; text: string; glow: string; pill: string }> = {
  green: { bg: 'rgb(16,185,129)', text: '#064e3b', glow: 'rgba(16,185,129,0.25)', pill: 'bg-emerald-500/10 text-emerald-400' },
  yellow: { bg: 'rgb(245,158,11)', text: '#78350f', glow: 'rgba(245,158,11,0.25)', pill: 'bg-amber-500/10 text-amber-400' },
  red: { bg: 'rgb(239,68,68)', text: '#7f1d1d', glow: 'rgba(239,68,68,0.25)', pill: 'bg-red-500/10 text-red-400' },
  gray: { bg: 'rgb(148,163,184)', text: '#334155', glow: 'rgba(148,163,184,0.15)', pill: 'bg-slate-500/10 text-slate-400' },
};
