import { Campaign } from './data';
import { getSignal, Signal } from './signals';

export interface ActionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CampaignRecommendation {
  campaignId: number;
  campaignName: string;
  platform: string;
  signal: Signal;
  metric: string;
  metricValue: string;
  metricTarget: string;
  title: string;
  actions: ActionItem[];
  chatPrompt: string;
  campaignContext: CampaignContext;
}

export interface CampaignContext {
  name: string;
  platform: string;
  roas: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  spent: number;
  budget: number;
  revenue: number;
  conversions: number;
  costPerResult: number;
  adSets?: { name: string; roas: number; ctr: number; spent: number; conversions: number }[];
}

function buildContext(c: Campaign): CampaignContext {
  return {
    name: c.name,
    platform: c.platform === 'meli' ? 'MercadoLibre' : 'Meta Ads',
    roas: c.roas,
    ctr: c.ctr,
    cpc: c.cpc,
    cpm: c.cpm,
    frequency: c.frequency,
    spent: c.spent,
    budget: c.budget,
    revenue: c.revenue,
    conversions: c.conversions,
    costPerResult: c.costPerResult,
    adSets: c.adSets?.map(a => ({ name: a.name, roas: a.roas, ctr: a.ctr, spent: a.spent, conversions: a.conversions })),
  };
}

export function getDetailedRecommendations(campaigns: Campaign[]): CampaignRecommendation[] {
  const recs: CampaignRecommendation[] = [];
  const p = (c: Campaign) => c.platform === 'meli' ? 'MercadoLibre' : 'Meta';
  const isMeli = (c: Campaign) => c.platform === 'meli';

  campaigns.forEach(c => {
    const ctx = buildContext(c);
    const platform = p(c);

    // ROAS signals
    const roasSignal = getSignal(c.roas, 'roas', c.platform);
    if (roasSignal === 'red') {
      const target = isMeli(c) ? '3x+' : '2x+';
      const worstAdSet = c.adSets?.length ? [...c.adSets].sort((a, b) => a.roas - b.roas)[0] : null;
      const actions: ActionItem[] = [
        { text: 'Pausar ad sets con ROAS menor a 1x para cortar pérdidas', priority: 'high' },
        { text: 'Reducir presupuesto un 30-50% mientras optimizás', priority: 'high' },
        { text: 'Revisar audiencia — puede estar demasiado amplia o saturada', priority: 'medium' },
        { text: 'Probar creatividades nuevas (el mensaje actual no está convirtiendo)', priority: 'medium' },
      ];
      if (worstAdSet) {
        actions.unshift({ text: `Pausar "${worstAdSet.name}" (ROAS ${worstAdSet.roas.toFixed(1)}x) — es el que peor rinde`, priority: 'high' });
      }
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'red', metric: 'ROAS',
        metricValue: `${c.roas.toFixed(2)}x`, metricTarget: target,
        title: `"${c.name}" tiene ROAS ${c.roas.toFixed(2)}x (objetivo: ${target}) — estás perdiendo plata`,
        actions, chatPrompt: `¿Por qué la campaña "${c.name}" tiene un ROAS tan bajo (${c.roas.toFixed(2)}x) y qué puedo hacer para mejorarlo? Gastamos $${c.spent.toFixed(0)} y generamos $${c.revenue.toFixed(0)} en ingresos.`,
        campaignContext: ctx,
      });
    } else if (roasSignal === 'yellow') {
      const target = isMeli(c) ? '8x+' : '4x+';
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'yellow', metric: 'ROAS',
        metricValue: `${c.roas.toFixed(2)}x`, metricTarget: target,
        title: `"${c.name}" ROAS ${c.roas.toFixed(2)}x — apenas cubre costos (objetivo: ${target})`,
        actions: [
          { text: 'Afiná la segmentación — excluí audiencias que no convierten', priority: 'high' },
          { text: 'Testear 2-3 creatividades nuevas con diferentes ángulos', priority: 'medium' },
          { text: 'Revisar landing page — puede haber fricción en la compra', priority: 'medium' },
          { text: `Redirigir presupuesto a los ad sets con mejor ROAS`, priority: 'medium' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene ROAS ${c.roas.toFixed(2)}x, que está apenas cubriendo costos. ¿Qué estrategias me recomendás para mejorar el retorno?`,
        campaignContext: ctx,
      });
    }

    // CTR signals
    const ctrSignal = getSignal(c.ctr, 'ctr', c.platform);
    if (ctrSignal === 'red') {
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'red', metric: 'CTR',
        metricValue: `${c.ctr.toFixed(1)}%`, metricTarget: '2%+',
        title: `"${c.name}" tiene CTR ${c.ctr.toFixed(1)}% — el anuncio no atrae clicks (objetivo: 2%+)`,
        actions: [
          { text: 'Renovar creatividades — probar imágenes/videos más llamativos', priority: 'high' },
          { text: 'Reescribir titulares con beneficios claros y urgencia', priority: 'high' },
          { text: 'Excluir placements que no funcionan (Stories vs Feed vs Reels)', priority: 'medium' },
          { text: 'Revisar si la audiencia es relevante para el producto', priority: 'medium' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene un CTR muy bajo (${c.ctr.toFixed(1)}%). ¿Qué cambios en creatividades y segmentación me recomendás para mejorar los clicks?`,
        campaignContext: ctx,
      });
    } else if (ctrSignal === 'yellow') {
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'yellow', metric: 'CTR',
        metricValue: `${c.ctr.toFixed(1)}%`, metricTarget: '2.5%+',
        title: `"${c.name}" CTR ${c.ctr.toFixed(1)}% — tiene margen de mejora`,
        actions: [
          { text: 'A/B testear 2 variantes de titular', priority: 'medium' },
          { text: 'Probar formato Carrusel o Video si estás usando imagen estática', priority: 'medium' },
          { text: 'Agregar un CTA más directo ("Comprá ahora" vs "Ver más")', priority: 'low' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene CTR ${c.ctr.toFixed(1)}%. ¿Cómo puedo mejorar la tasa de clicks?`,
        campaignContext: ctx,
      });
    }

    // CPC signals
    const cpcSignal = getSignal(c.cpc, 'cpc', c.platform);
    if (cpcSignal === 'red') {
      const cpcTarget = isMeli(c) ? '$10 ARS' : '$0.30 USD';
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'red', metric: 'CPC',
        metricValue: isMeli(c) ? `$${c.cpc.toFixed(0)} ARS` : `$${c.cpc.toFixed(2)} USD`,
        metricTarget: `< ${cpcTarget}`,
        title: `"${c.name}" CPC es ${isMeli(c) ? `$${c.cpc.toFixed(0)}` : `$${c.cpc.toFixed(2)}`} — clicks muy caros (objetivo: < ${cpcTarget})`,
        actions: [
          { text: 'Bajar bids un 20% y monitorear volumen', priority: 'high' },
          { text: 'Pausar placements/keywords más caros', priority: 'high' },
          { text: 'Agregar negative keywords para evitar tráfico irrelevante', priority: 'medium' },
          { text: 'Mejorar Quality Score con mejores ads (reduce CPC automáticamente)', priority: 'medium' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene un CPC muy alto (${isMeli(c) ? `$${c.cpc.toFixed(0)}` : `$${c.cpc.toFixed(2)}`}). ¿Cómo puedo reducir el costo por click sin perder conversiones?`,
        campaignContext: ctx,
      });
    }

    // Frequency signals
    const freqSignal = getSignal(c.frequency, 'frequency', c.platform);
    if (freqSignal === 'red' || freqSignal === 'yellow') {
      recs.push({
        campaignId: c.id, campaignName: c.name, platform,
        signal: freqSignal === 'red' ? 'red' : 'yellow', metric: 'Frecuencia',
        metricValue: c.frequency.toFixed(1), metricTarget: '< 2.0',
        title: `"${c.name}" frecuencia ${c.frequency.toFixed(1)} — la audiencia está viendo el anuncio demasiado`,
        actions: [
          { text: 'Renovar creatividades para evitar fatiga del anuncio', priority: 'high' },
          { text: 'Ampliar la audiencia o crear un Lookalike nuevo', priority: 'medium' },
          { text: 'Configurar frequency cap si la plataforma lo permite', priority: 'medium' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene frecuencia ${c.frequency.toFixed(1)}. ¿Cómo puedo reducir la fatiga del anuncio y llegar a gente nueva?`,
        campaignContext: ctx,
      });
    }

    // CostPerResult signals
    const cprSignal = getSignal(c.costPerResult, 'costPerResult', c.platform);
    if (cprSignal === 'red') {
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'red', metric: 'Costo/Resultado',
        metricValue: isMeli(c) ? `$${c.costPerResult.toFixed(0)}` : `$${c.costPerResult.toFixed(2)}`,
        metricTarget: isMeli(c) ? '< $500' : '< $25',
        title: `"${c.name}" cuesta ${isMeli(c) ? `$${c.costPerResult.toFixed(0)}` : `$${c.costPerResult.toFixed(2)}`} por conversión — muy caro`,
        actions: [
          { text: 'Optimizar el embudo — revisar landing page y checkout', priority: 'high' },
          { text: 'Enfocar presupuesto en audiencias que ya convirtieron antes', priority: 'high' },
          { text: 'Probar ofertas o descuentos para mejorar tasa de conversión', priority: 'medium' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene un costo por resultado de ${isMeli(c) ? `$${c.costPerResult.toFixed(0)}` : `$${c.costPerResult.toFixed(2)}`}. ¿Qué puedo hacer para reducir el costo de adquisición?`,
        campaignContext: ctx,
      });
    }

    // Green ROAS with budget headroom → scale opportunity
    if (roasSignal === 'green' && c.spent < c.budget * 0.8) {
      recs.push({
        campaignId: c.id, campaignName: c.name, platform, signal: 'green', metric: 'ROAS',
        metricValue: `${c.roas.toFixed(2)}x`, metricTarget: '—',
        title: `🚀 "${c.name}" rinde ${c.roas.toFixed(1)}x y tiene margen — oportunidad de escalar`,
        actions: [
          { text: `Aumentar presupuesto un 20-30% (de $${c.budget.toLocaleString()} a $${Math.round(c.budget * 1.25).toLocaleString()})`, priority: 'high' },
          { text: 'Duplicar los ad sets ganadores con audiencias similares', priority: 'medium' },
          { text: 'Monitorear que el ROAS se mantenga al escalar', priority: 'low' },
        ],
        chatPrompt: `La campaña "${c.name}" tiene un excelente ROAS de ${c.roas.toFixed(2)}x y solo gastó el ${((c.spent / c.budget) * 100).toFixed(0)}% del presupuesto. ¿Cómo puedo escalar sin perder rentabilidad?`,
        campaignContext: ctx,
      });
    }

    // Ad set disparity
    if (c.adSets && c.adSets.length > 1) {
      const sorted = [...c.adSets].sort((a, b) => b.roas - a.roas);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (best.roas > worst.roas * 1.8) {
        recs.push({
          campaignId: c.id, campaignName: c.name, platform, signal: 'green', metric: 'Ad Sets',
          metricValue: `${best.roas.toFixed(1)}x vs ${worst.roas.toFixed(1)}x`, metricTarget: '—',
          title: `"${c.name}" tiene ad sets con rendimiento muy diferente — redistribuir presupuesto`,
          actions: [
            { text: `Mover presupuesto de "${worst.name}" (${worst.roas.toFixed(1)}x) a "${best.name}" (${best.roas.toFixed(1)}x)`, priority: 'high' },
            { text: `Pausar "${worst.name}" si ROAS sigue bajo después de 3 días`, priority: 'medium' },
            { text: `Crear un Lookalike basado en las conversiones de "${best.name}"`, priority: 'low' },
          ],
          chatPrompt: `En la campaña "${c.name}", el ad set "${best.name}" tiene ROAS ${best.roas.toFixed(1)}x pero "${worst.name}" solo ${worst.roas.toFixed(1)}x. ¿Cómo debo redistribuir el presupuesto?`,
          campaignContext: ctx,
        });
      }
    }

    // Trend decline
    if (c.trend && c.trend.length >= 3) {
      const last3 = c.trend.slice(-3);
      if (last3[2] < last3[0] * 0.85) {
        recs.push({
          campaignId: c.id, campaignName: c.name, platform, signal: 'yellow', metric: 'Tendencia',
          metricValue: `${last3[0].toFixed(1)}x → ${last3[2].toFixed(1)}x`, metricTarget: 'Estable o subiendo',
          title: `"${c.name}" ROAS cayendo — de ${last3[0].toFixed(1)}x a ${last3[2].toFixed(1)}x en 3 días`,
          actions: [
            { text: 'Puede ser fatiga del anuncio — renovar creatividades', priority: 'high' },
            { text: 'Revisar si hay nueva competencia en la subasta', priority: 'medium' },
            { text: 'Chequear si la audiencia se está agotando (reach vs reach anterior)', priority: 'medium' },
          ],
          chatPrompt: `La campaña "${c.name}" viene cayendo en ROAS (de ${last3[0].toFixed(1)}x a ${last3[2].toFixed(1)}x). ¿Qué puede estar pasando y cómo lo corrijo?`,
          campaignContext: ctx,
        });
      }
    }
  });

  // Sort: red first, then yellow, then green
  recs.sort((a, b) => {
    const order: Record<string, number> = { red: 0, yellow: 1, green: 2, gray: 3 };
    return (order[a.signal] ?? 3) - (order[b.signal] ?? 3);
  });

  return recs;
}

// Legacy interface for backwards compat
export interface Recommendation {
  type: Signal;
  icon: string;
  text: string;
}

export function getRecommendations(campaigns: Campaign[]): Recommendation[] {
  return getDetailedRecommendations(campaigns).map(r => ({
    type: r.signal,
    icon: r.signal === 'red' ? '🚨' : r.signal === 'yellow' ? '⚠️' : '🚀',
    text: r.title,
  }));
}
