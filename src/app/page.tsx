'use client';

import { useState, useEffect, useCallback } from 'react';
import { Campaign } from '@/lib/data';
import { getSignal, SIGNAL_COLORS, getSignalLabel, Signal } from '@/lib/signals';
import { getRecommendations, Recommendation } from '@/lib/recommendations';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SignalDot } from '@/components/dashboard/SignalDot';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { BarChart } from '@/components/dashboard/BarChart';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { HorizontalBarChart } from '@/components/dashboard/HorizontalBarChart';
import { LineChart } from '@/components/dashboard/LineChart';
import { KpiSkeleton, CampaignSkeleton, LoadingOverlay } from '@/components/dashboard/Skeleton';

type Tab = 'all' | 'meta' | 'meli';
type DatePreset = '7d' | '14d' | '30d' | '90d' | 'custom';

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { dateFrom: string; dateTo: string } {
  if (preset === 'custom' && customFrom && customTo) return { dateFrom: customFrom, dateTo: customTo };
  const days = preset === '14d' ? 14 : preset === '30d' ? 30 : preset === '90d' ? 90 : 7;
  const today = new Date();
  const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  return { dateFrom: from.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
}

function formatCurrency(val: number, platform: string, currencyMode: 'ARS' | 'USD' = 'ARS', blueRate: number = 1300) {
  if (platform === 'meli') return `$${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  // Meta values are in USD
  if (currencyMode === 'ARS') {
    const arsVal = val * blueRate;
    return `$${arsVal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  }
  return `US$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/* ─── Glossary ─── */
const GLOSSARY = [
  { term: 'ROAS (Retorno sobre inversión)', explain: 'Por cada $1 que gastás, cuántos dólares vuelven. Un ROAS de 5x = $5 de ingreso por $1 gastado. Arriba de 4x es genial, abajo de 2x es problema.' },
  { term: 'CTR (Tasa de clicks)', explain: 'De todos los que vieron tu anuncio, qué % hizo click. Como una vidriera — un CTR alto significa que tu anuncio llama la atención.' },
  { term: 'CPC (Costo por click)', explain: 'Cuánto pagás cada vez que alguien hace click en tu anuncio. Más bajo es mejor — significa tráfico más barato.' },
  { term: 'CPM (Costo por 1000 vistas)', explain: 'Cuánto cuesta mostrar tu anuncio 1000 veces. Te ayuda a comparar qué tan caro es llegar a distintas audiencias.' },
  { term: 'Frecuencia', explain: 'Cuántas veces la misma persona ve tu anuncio en promedio. Arriba de 2.5 significa que lo están viendo demasiado (fatiga).' },
  { term: 'Costo por resultado', explain: 'Cuánto pagás por cada conversión (venta, lead, etc). Más bajo es mejor — es tu costo real de conseguir un cliente.' },
];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [sources, setSources] = useState<any>({});
  const [aiAnalysis, setAiAnalysis] = useState<{ analysis: string; date: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'ARS' | 'USD'>('ARS');
  const [blueRate, setBlueRate] = useState<number>(1300);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);

  const { dateFrom, dateTo } = getDateRange(datePreset, customFrom, customTo);

  useEffect(() => {
    fetch('/api/ai/daily-analysis')
      .then(r => r.json())
      .then(data => { if (data.analysis) setAiAnalysis(data); })
      .catch(() => {});
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(data => { if (data.venta) setBlueRate(data.venta); })
      .catch(() => {});
  }, []);

  const [comparison, setComparison] = useState<any>(null);
  const [comparisonMeta, setComparisonMeta] = useState<any>(null);
  const [comparisonMeli, setComparisonMeli] = useState<any>(null);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    fetch(`/api/campaigns?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then(r => r.json())
      .then(data => {
        setCampaigns(data.campaigns || []);
        setUpdatedAt(data.updatedAt || '');
        setSources(data.sources || {});
        setComparison(data.comparison || null);
        setComparisonMeta(data.comparisonMeta || null);
        setComparisonMeli(data.comparisonMeli || null);
        setDailyMetrics(data.dailyMetrics || []);
        setLoading(false);
        setInitialLoad(false);
      })
      .catch(() => { setLoading(false); setInitialLoad(false); });
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filtered = tab === 'all'
    ? campaigns
    : campaigns.filter(c => c.platform === tab);

  const totalSpent = filtered.reduce((s, c) => s + c.spent, 0);
  const totalRevenue = filtered.reduce((s, c) => s + c.revenue, 0);
  const totalConversions = filtered.reduce((s, c) => s + c.conversions, 0);
  const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const avgCTR = filtered.length > 0 ? filtered.reduce((s, c) => s + c.ctr, 0) / filtered.length : 0;
  const avgCPC = filtered.length > 0 ? filtered.reduce((s, c) => s + c.cpc, 0) / filtered.length : 0;

  const isMeli = tab === 'meli';
  const platform = isMeli ? 'meli' : 'meta';
  const currency = isMeli ? 'ARS' : (currencyMode === 'ARS' ? 'ARS' : 'USD');

  // Comparison data based on active tab
  const comp = tab === 'meta' ? comparisonMeta : tab === 'meli' ? comparisonMeli : comparison;
  function pctChange(curr: number, prev: number): number | null {
    if (!comp || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }
  // For inverted metrics (lower is better), negate the change for display coloring
  const roasChange = comp ? pctChange(avgRoas, comp.previous.avgRoas) : null;
  const ctrChange = comp ? pctChange(avgCTR, comp.previous.avgCTR) : null;
  const cpcChange = comp ? (comp.previous.avgCPC > 0 ? -((avgCPC - comp.previous.avgCPC) / comp.previous.avgCPC * 100) : null) : null;
  const spentChange = comp ? pctChange(totalSpent, comp.previous.totalSpent) : null;
  const revenueChange = comp ? pctChange(totalRevenue, comp.previous.totalRevenue) : null;
  const convChange = comp ? pctChange(totalConversions, comp.previous.totalConversions) : null;

  const recommendations = getRecommendations(filtered);
  const detailCamp = selectedId !== null ? campaigns.find(c => c.id === selectedId) : null;

  return (
    <div className="relative min-h-screen">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-5 py-6 pb-24 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-7">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
              📊 Ads Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {loading ? 'Cargando datos...' : (
                <>
                  {sources.meta?.connected && <span className="text-emerald-400">Meta ✓</span>}
                  {sources.meta?.connected && sources.meli?.connected && ' · '}
                  {sources.meli?.connected && <span className="text-emerald-400">MeLi ✓</span>}
                  {!sources.meta?.connected && !sources.meli?.connected && 'Sin conexión a plataformas'}
                  {updatedAt && <span className="text-slate-600"> · {new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </>
              )}
            </p>
          </div>

          {/* Currency toggle + Platform tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/20 rounded-lg p-0.5">
              {(['ARS', 'USD'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrencyMode(c)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    currencyMode === c ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 hidden sm:block">Blue: ${blueRate.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'meta', 'meli'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedId(null); }}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                  tab === t
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                    : 'border-slate-700/20 bg-slate-900/50 text-slate-400 hover:text-slate-300 hover:border-slate-600/30'
                }`}
              >
                {t === 'all' ? 'Todas' : t === 'meta' ? 'Meta Ads' : 'MercadoLibre'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {(['7d', '14d', '30d', '90d'] as DatePreset[]).map(p => (
            <button
              key={p}
              onClick={() => { setDatePreset(p); setShowCustomRange(false); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                datePreset === p && !showCustomRange
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                  : 'border-slate-700/20 bg-slate-900/50 text-slate-400 hover:text-slate-300 hover:border-slate-600/30'
              }`}
            >
              {p === '7d' ? '7 días' : p === '14d' ? '14 días' : p === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
          <button
            onClick={() => { setShowCustomRange(!showCustomRange); setDatePreset('custom'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showCustomRange
                ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                : 'border-slate-700/20 bg-slate-900/50 text-slate-400 hover:text-slate-300 hover:border-slate-600/30'
            }`}
          >
            📅 Personalizado
          </button>
          {showCustomRange && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
              />
              <span className="text-slate-500 text-xs">→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="bg-slate-800/80 border border-slate-700/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          )}
          <span className="text-[10px] text-slate-500 ml-auto hidden sm:block">
            {dateFrom} — {dateTo}
          </span>
        </div>

        {/* KPI Cards (clickable) */}
        {initialLoad ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
          </div>
        ) : null}

        {initialLoad ? (
          <div className="mb-6">
            <div className="animate-pulse rounded bg-slate-700/30 h-4 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <CampaignSkeleton key={i} />)}
            </div>
          </div>
        ) : null}

        {!initialLoad && <div className="relative">
        {loading && !initialLoad && <LoadingOverlay />}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-2">
          {([
            { key: 'roas', label: 'ROAS Total', value: avgRoas.toFixed(2), suffix: 'x', signal: getSignal(avgRoas, 'roas', platform), change: roasChange },
            { key: 'ctr', label: 'CTR Prom.', value: avgCTR.toFixed(1), suffix: '%', signal: getSignal(avgCTR, 'ctr', platform), change: ctrChange },
            { key: 'cpc', label: 'CPC Prom.', value: isMeli ? avgCPC.toFixed(0) : (currencyMode === 'ARS' ? (avgCPC * blueRate).toFixed(0) : avgCPC.toFixed(3)), suffix: ` ${currency}`, signal: getSignal(avgCPC, 'cpc', platform), change: cpcChange },
            { key: 'spent', label: 'Gastado', value: formatCurrency(totalSpent, platform, currencyMode, blueRate), suffix: '', signal: 'gray' as Signal, change: spentChange },
            { key: 'revenue', label: 'Ingresos', value: formatCurrency(totalRevenue, platform, currencyMode, blueRate), suffix: '', signal: (avgRoas >= 2 ? 'green' : avgRoas >= 1 ? 'yellow' : 'red') as Signal, change: revenueChange },
            { key: 'conversions', label: 'Conversiones', value: totalConversions.toString(), suffix: '', signal: 'gray' as Signal, change: convChange },
          ] as const).map(kpi => (
            <button key={kpi.key} onClick={() => setExpandedKpi(expandedKpi === kpi.key ? null : kpi.key)} className={`text-left transition-all rounded-xl ${expandedKpi === kpi.key ? 'ring-2 ring-indigo-500/40' : ''}`}>
              <MetricCard label={kpi.label} value={kpi.value} suffix={kpi.suffix} signal={kpi.signal} change={kpi.change} />
            </button>
          ))}
        </div>

        {/* Expanded KPI Chart */}
        {expandedKpi && dailyMetrics.length > 0 && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <LineChart
              title={{
                roas: '📈 ROAS Diario',
                ctr: '📈 CTR Diario (%)',
                cpc: '📈 CPC Diario',
                spent: '📈 Gasto Diario',
                revenue: '📈 Ingresos Diarios',
                conversions: '📈 Conversiones Diarias',
              }[expandedKpi] || ''}
              data={dailyMetrics.map(d => ({
                label: d.date?.slice(5) || '',
                value: expandedKpi === 'roas' ? d.roas
                  : expandedKpi === 'ctr' ? d.ctr
                  : expandedKpi === 'cpc' ? d.cpc
                  : expandedKpi === 'spent' ? d.spent
                  : expandedKpi === 'revenue' ? d.revenue
                  : d.conversions,
              }))}
              formatValue={expandedKpi === 'roas' ? (v => v.toFixed(2) + 'x')
                : expandedKpi === 'ctr' ? (v => v.toFixed(1) + '%')
                : expandedKpi === 'conversions' ? (v => Math.round(v).toString())
                : (v => '$' + v.toLocaleString('es-AR', { maximumFractionDigits: 0 }))}
              color={expandedKpi === 'roas' ? '#6366f1' : expandedKpi === 'revenue' ? '#10b981' : expandedKpi === 'spent' ? '#f59e0b' : '#8b5cf6'}
            />
          </div>
        )}
        {!expandedKpi && <div className="mb-4" />}

        {/* Campaign List */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-300 mb-3">Campañas</h2>
          <div className="space-y-2">
            {filtered.map(c => {
              const roasSig = getSignal(c.roas, 'roas', c.platform);
              const isSelected = selectedId === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(isSelected ? null : c.id)}
                  className={`w-full text-left rounded-xl border px-3 sm:px-4 py-3 transition-all ${
                    isSelected
                      ? 'bg-blue-500/5 border-blue-500/25'
                      : 'bg-slate-900/50 border-slate-700/10 hover:border-slate-600/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Name + platform */}
                    <SignalDot color={roasSig} size={12} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.platform === 'meta' ? 'Meta' : 'MeLi'} · {c.status === 'active' ? '🟢 Activa' : '⏸ Pausada'}
                      </div>
                    </div>

                    {/* Metrics - hide some on mobile */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">ROAS</div>
                      <div className="text-sm font-bold" style={{ color: SIGNAL_COLORS[roasSig].bg }}>
                        {c.roas.toFixed(2)}x
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500">Gastado</div>
                      <div className="text-xs font-semibold text-slate-300">
                        {formatCurrency(c.spent, c.platform, currencyMode, blueRate)}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500">Conv</div>
                      <div className="text-xs font-semibold text-slate-300">{c.conversions}</div>
                    </div>
                    <div className="hidden sm:block">
                      <Sparkline data={c.trend} color={roasSig} width={72} height={28} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campaign Detail */}
        {detailCamp && (
          <div className="rounded-2xl border border-slate-700/15 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">{detailCamp.name}</h3>
              <span className={`inline-block text-[11px] font-semibold px-3 py-1 rounded-lg ${SIGNAL_COLORS[getSignal(detailCamp.roas, 'roas', detailCamp.platform)].pill}`}>
                General: {getSignalLabel(getSignal(detailCamp.roas, 'roas', detailCamp.platform))}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
              <MetricCard small label="ROAS" value={detailCamp.roas.toFixed(2)} suffix="x" signal={getSignal(detailCamp.roas, 'roas', detailCamp.platform)} spark={detailCamp.trend} />
              <MetricCard small label="CTR" value={detailCamp.ctr.toFixed(1)} suffix="%" signal={getSignal(detailCamp.ctr, 'ctr', detailCamp.platform)} />
              <MetricCard small label="CPC" value={detailCamp.platform === 'meli' ? detailCamp.cpc.toFixed(0) : detailCamp.cpc.toFixed(3)} suffix={` ${detailCamp.platform === 'meli' ? 'ARS' : 'USD'}`} signal={getSignal(detailCamp.cpc, 'cpc', detailCamp.platform)} />
              <MetricCard small label="CPM" value={detailCamp.cpm.toFixed(2)} signal={getSignal(detailCamp.cpm, 'cpm', detailCamp.platform)} />
              <MetricCard small label="Frecuencia" value={detailCamp.frequency.toFixed(2)} signal={getSignal(detailCamp.frequency, 'frequency', detailCamp.platform)} />
              <MetricCard small label="Costo/Resultado" value={detailCamp.costPerResult.toFixed(2)} signal={getSignal(detailCamp.costPerResult, 'costPerResult', detailCamp.platform)} />
            </div>

            {detailCamp.adSets && detailCamp.adSets.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <BarChart items={detailCamp.adSets} valueKey="roas" label={detailCamp.platform === 'meli' ? 'ROAS por Producto' : 'ROAS por Ad Set'} platform={detailCamp.platform} />
                <BarChart items={detailCamp.adSets} valueKey="ctr" label={detailCamp.platform === 'meli' ? 'CTR por Producto' : 'CTR por Ad Set'} platform={detailCamp.platform} />
              </div>
            )}

            {/* Audience Segmentation */}
            {detailCamp.demographics && (detailCamp.demographics.gender?.length || detailCamp.demographics.age?.length || detailCamp.demographics.region?.length) ? (
              <div className="mt-5 pt-5 border-t border-slate-700/15">
                <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                  🎯 Audiencia
                </h4>
                <div className="grid sm:grid-cols-3 gap-6">
                  {/* Gender donut */}
                  {detailCamp.demographics.gender && detailCamp.demographics.gender.length > 0 && (
                    <DonutChart
                      label="Género (Impresiones)"
                      slices={detailCamp.demographics.gender.map(g => ({
                        label: g.label,
                        value: g.value,
                        color: g.label === 'Hombres' ? '#6366f1' : g.label === 'Mujeres' ? '#ec4899' : '#64748b',
                      }))}
                    />
                  )}

                  {/* Age bars */}
                  {detailCamp.demographics.age && detailCamp.demographics.age.length > 0 && (
                    <HorizontalBarChart
                      title="Edad (Impresiones)"
                      bars={detailCamp.demographics.age.map(a => ({ label: a.label, value: a.value }))}
                      color="#8b5cf6"
                    />
                  )}

                  {/* Region bars */}
                  {detailCamp.demographics.region && detailCamp.demographics.region.length > 0 && (
                    <HorizontalBarChart
                      title="Región (Impresiones)"
                      bars={detailCamp.demographics.region.map(r => ({ label: r.label, value: r.value }))}
                      color="#06b6d4"
                      maxBars={6}
                    />
                  )}
                </div>
              </div>
            ) : detailCamp.platform === 'meli' ? (
              <div className="mt-5 pt-5 border-t border-slate-700/15">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>🎯</span>
                  <span>MercadoLibre no proporciona datos demográficos de audiencia a través de su API.</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* AI Daily Analysis */}
        {aiAnalysis && (
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                🤖 Análisis AI del Día
              </h2>
              <span className="text-[10px] text-slate-500">
                {aiAnalysis.date && new Date(aiAnalysis.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap [&>*]:mb-2">
              {aiAnalysis.analysis.split('\n').map((line, i) => {
                // Style section headers
                if (line.match(/^(📊|🚨|🚀|🎯|💡)/)) {
                  return <div key={i} className="font-bold text-slate-200 mt-4 mb-1">{line}</div>;
                }
                if (line.match(/^🟢/)) return <div key={i} className="text-emerald-400">{line}</div>;
                if (line.match(/^🟡/)) return <div key={i} className="text-amber-400">{line}</div>;
                if (line.match(/^🔴/)) return <div key={i} className="text-red-400">{line}</div>;
                if (line.match(/^\d+\./)) return <div key={i} className="ml-2 mb-1">{line}</div>;
                return <div key={i}>{line}</div>;
              })}
            </div>
            <button
              onClick={async () => {
                setAiLoading(true);
                try {
                  const res = await fetch(`/api/ai/daily-analysis?dateFrom=${dateFrom}&dateTo=${dateTo}`, { method: 'POST' });
                  const data = await res.json();
                  if (data.analysis) setAiAnalysis({ analysis: data.analysis, date: data.date });
                } catch {}
                setAiLoading(false);
              }}
              disabled={aiLoading}
              className="mt-4 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '⏳ Generando nuevo análisis...' : '🔄 Regenerar análisis'}
            </button>
          </div>
        )}

        {!aiAnalysis && (
          <div className="rounded-2xl border border-slate-700/15 bg-slate-900/40 p-4 sm:p-6 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-400">🤖 Análisis AI del Día</h2>
              <p className="text-xs text-slate-500 mt-1">Se genera automáticamente a las 6:00 AM</p>
            </div>
            <button
              onClick={async () => {
                setAiLoading(true);
                try {
                  const res = await fetch('/api/ai/daily-analysis', { method: 'POST' });
                  const data = await res.json();
                  if (data.analysis) setAiAnalysis({ analysis: data.analysis, date: data.date });
                } catch {}
                setAiLoading(false);
              }}
              disabled={aiLoading}
              className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '⏳ Generando...' : '▶ Generar ahora'}
            </button>
          </div>
        )}

        {/* Recommendations */}
        <div className="rounded-2xl border border-slate-700/15 bg-slate-900/60 p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-300 mb-4">🎯 Plan de Acción — Qué Hacer Ahora</h2>
          <div className="space-y-2.5">
            {recommendations.map((r, i) => (
              <div
                key={i}
                className={`flex gap-3 items-start rounded-xl border px-4 py-3 ${SIGNAL_COLORS[r.type].pill} border-current/10`}
              >
                <span className="text-lg flex-shrink-0">{r.icon}</span>
                <span className="text-[13px] leading-relaxed text-slate-300">{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        </div>}

        {/* Glossary */}
        <div className="rounded-2xl border border-slate-700/10 bg-slate-900/40 p-4 sm:p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-4">📖 ¿Qué significan estos números?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {GLOSSARY.map((g, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-3.5">
                <div className="text-xs font-bold text-blue-400 mb-1">{g.term}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{g.explain}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
