import { NextResponse } from 'next/server';

type CachedRate = {
  rate: number;
  buy?: number;
  timestamp: number;
  source: string;
  updatedAt?: string;
};

let cached: CachedRate | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const FALLBACK_RATE = 1300;

async function fetchDolarApiBlue(): Promise<CachedRate> {
  const res = await fetch('https://dolarapi.com/v1/dolares/blue', { cache: 'no-store' });
  if (!res.ok) throw new Error(`DolarAPI responded ${res.status}`);
  const data = await res.json();
  const rate = Number(data.venta);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('DolarAPI returned an invalid sell rate');

  return {
    rate,
    buy: Number(data.compra) || undefined,
    timestamp: Date.now(),
    source: 'dolarapi.com',
    updatedAt: data.fechaActualizacion,
  };
}

async function fetchMonedApiBlue(): Promise<CachedRate> {
  const res = await fetch('https://monedapi.ar/api/v2/usd/blue', { cache: 'no-store' });
  if (!res.ok) throw new Error(`MonedAPI responded ${res.status}`);
  const data = await res.json();
  const rate = Number(data.sell);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('MonedAPI returned an invalid sell rate');

  return {
    rate,
    buy: Number(data.buy) || undefined,
    timestamp: Date.now(),
    source: 'monedapi.ar',
    updatedAt: data.updatedAt,
  };
}

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      venta: cached.rate,
      compra: cached.buy,
      source: cached.source,
      updatedAt: cached.updatedAt,
      cached: true,
    });
  }

  try {
    cached = await fetchDolarApiBlue();
  } catch (dolarApiError) {
    try {
      cached = await fetchMonedApiBlue();
    } catch (monedApiError) {
      return NextResponse.json({
        venta: cached?.rate || FALLBACK_RATE,
        compra: cached?.buy,
        source: cached?.source || 'fallback',
        updatedAt: cached?.updatedAt,
        cached: !!cached,
        error: true,
        details: {
          dolarapi: String(dolarApiError),
          monedapi: String(monedApiError),
        },
      });
    }
  }

  return NextResponse.json({
    venta: cached.rate,
    compra: cached.buy,
    source: cached.source,
    updatedAt: cached.updatedAt,
    cached: false,
  });
}
