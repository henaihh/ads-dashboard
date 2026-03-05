import { Campaign } from './data';
import { getSignal, Signal } from './signals';

export interface Recommendation {
  type: Signal;
  icon: string;
  text: string;
}

export function getRecommendations(campaigns: Campaign[]): Recommendation[] {
  const recs: Recommendation[] = [];

  campaigns.forEach(c => {
    const p = c.platform === 'meli' ? 'MercadoLibre' : 'Meta';

    if (getSignal(c.roas, 'roas', c.platform) === 'red') {
      recs.push({
        type: 'red', icon: '🚨',
        text: `${p}: "${c.name}" tiene un ROAS de ${c.roas.toFixed(2)}x — estás perdiendo plata. Considerá pausarla o cambiar completamente la audiencia/creatividad.`,
      });
    }

    if (getSignal(c.roas, 'roas', c.platform) === 'yellow') {
      recs.push({
        type: 'yellow', icon: '⚠️',
        text: `${p}: "${c.name}" ROAS es ${c.roas.toFixed(2)}x — apenas cubriendo costos. Probá nuevas creatividades o afiná la audiencia.`,
      });
    }

    if (getSignal(c.frequency, 'frequency', c.platform) === 'red') {
      recs.push({
        type: 'yellow', icon: '🔄',
        text: `${p}: "${c.name}" frecuencia es ${c.frequency.toFixed(1)} — la gente está viendo tu anuncio demasiadas veces. Renovar creatividades o ampliar audiencia.`,
      });
    }

    if (getSignal(c.roas, 'roas', c.platform) === 'green' && c.spent < c.budget * 0.8) {
      recs.push({
        type: 'green', icon: '🚀',
        text: `${p}: "${c.name}" rinde muy bien (${c.roas.toFixed(1)}x ROAS) y tiene margen de presupuesto. Considerá aumentar el gasto para escalar.`,
      });
    }

    if (c.trend && c.trend.length >= 3) {
      const last3 = c.trend.slice(-3);
      if (last3[2] < last3[0] * 0.85) {
        recs.push({
          type: 'yellow', icon: '📉',
          text: `${p}: "${c.name}" ROAS está cayendo — bajó de ${last3[0].toFixed(1)}x a ${last3[2].toFixed(1)}x. Puede ser fatiga del anuncio.`,
        });
      }
    }

    if (c.adSets && c.adSets.length > 1) {
      const sorted = [...c.adSets].sort((a, b) => b.roas - a.roas);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      if (best.roas > worst.roas * 1.8) {
        recs.push({
          type: 'green', icon: '🎯',
          text: `${p}: En "${c.name}", el ad set "${best.name}" (${best.roas.toFixed(1)}x) supera a "${worst.name}" (${worst.roas.toFixed(1)}x). Mové presupuesto al ganador.`,
        });
      }
    }
  });

  recs.sort((a, b) => {
    const order: Record<string, number> = { red: 0, yellow: 1, green: 2, gray: 3 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  return recs;
}
