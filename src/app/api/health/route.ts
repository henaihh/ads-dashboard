import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
}
// Thu Mar  5 03:11:25 AM UTC 2026
