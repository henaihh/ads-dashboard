import { NextResponse } from 'next/server';

let cached: { rate: number; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

export async function GET() {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ venta: cached.rate, cached: true });
  }

  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', { cache: 'no-store' });
    const data = await res.json();
    const rate = data.venta || 1300;
    cached = { rate, timestamp: Date.now() };
    return NextResponse.json({ venta: rate, compra: data.compra, cached: false });
  } catch {
    return NextResponse.json({ venta: cached?.rate || 1300, error: true });
  }
}
