'use client';

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-800/60 ${className}`} />
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/10 bg-slate-900/40 p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="animate-pulse rounded bg-slate-700/40 h-3 w-16" />
        <div className="animate-pulse rounded-full bg-slate-700/40 h-3 w-3" />
      </div>
      <div className="animate-pulse rounded bg-slate-700/30 h-7 w-20 mb-2" />
      <div className="animate-pulse rounded bg-slate-700/20 h-4 w-14" />
    </div>
  );
}

export function CampaignSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/10 bg-slate-900/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="animate-pulse rounded-full bg-slate-700/40 h-3 w-3" />
        <div className="flex-1">
          <div className="animate-pulse rounded bg-slate-700/30 h-4 w-40 mb-1.5" />
          <div className="animate-pulse rounded bg-slate-700/20 h-3 w-24" />
        </div>
        <div className="animate-pulse rounded bg-slate-700/30 h-6 w-12" />
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex items-start justify-center pt-32 rounded-2xl transition-all">
      <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/30 px-5 py-3 rounded-xl shadow-xl">
        <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-300">Cargando datos...</span>
      </div>
    </div>
  );
}
