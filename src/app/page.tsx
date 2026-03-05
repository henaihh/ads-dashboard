'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/lib/data';
import { getSignal, SIGNAL_COLORS, getSignalLabel, Signal } from '@/lib/signals';
import { getRecommendations, Recommendation } from '@/lib/recommendations';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SignalDot } from '@/components/dashboard/SignalDot';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { BarChart } from '@/components/dashboard/BarChart';
import { DonutChart } from '@/components/dashboard/DonutChart';
import { HorizontalBarChart } from '@/components/dashboard/HorizontalBarChart';

type Tab = 'all' | 'meta' | 'meli';

function formatCurrency(val: number, platform: string) {
  if (platform === 'meli') return `$${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
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
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [sources, setSources] = useState<any>({});

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        setCampaigns(data.campaigns || []);
        setUpdatedAt(data.updatedAt || '');
        setSources(data.sources || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
  const currency = isMeli ? 'ARS' : 'USD';

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

          {/* Platform tabs */}
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

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-6">
          <MetricCard label="ROAS Total" value={avgRoas.toFixed(2)} suffix="x" signal={getSignal(avgRoas, 'roas', platform)} />
          <MetricCard label="CTR Prom." value={avgCTR.toFixed(1)} suffix="%" signal={getSignal(avgCTR, 'ctr', platform)} />
          <MetricCard label="CPC Prom." value={isMeli ? avgCPC.toFixed(0) : avgCPC.toFixed(3)} suffix={` ${currency}`} signal={getSignal(avgCPC, 'cpc', platform)} />
          <MetricCard label="Gastado" value={formatCurrency(totalSpent, platform)} signal="gray" />
          <MetricCard label="Ingresos" value={formatCurrency(totalRevenue, platform)} signal={avgRoas >= 2 ? 'green' : avgRoas >= 1 ? 'yellow' : 'red'} />
          <MetricCard label="Conversiones" value={totalConversions.toString()} signal="gray" />
        </div>

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
                        {formatCurrency(c.spent, c.platform)}
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
