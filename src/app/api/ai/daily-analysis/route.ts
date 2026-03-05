import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';

const SYSTEM_PROMPT = `You are an expert advertising strategist for a shoe company that runs ads on Meta (Facebook/Instagram) and MercadoLibre. You receive the full campaign performance data and must produce a DAILY ACTION PLAN.

RULES:
- Write in Spanish (the business owner speaks Spanish)
- Use simple, non-technical language — the reader does NOT understand ad jargon
- Structure your response in exactly these sections:

1. 📊 RESUMEN DEL DÍA — 2-3 sentence overview of overall performance (good day, bad day, mixed?)
2. 🚨 PROBLEMAS URGENTES — campaigns losing money or declining fast. Be specific: campaign name, what's wrong, what to do RIGHT NOW
3. 🚀 OPORTUNIDADES — campaigns performing well that could be scaled. Include specific budget increase suggestions
4. 🎯 PLAN DE ACCIÓN PARA HOY — numbered list of 3-5 concrete actions ordered by priority. Each action must say exactly WHAT to do, in WHICH campaign, and WHY
5. 💡 CONSEJO DEL DÍA — one tactical tip about ads the owner can learn today (explain a concept, suggest a test, share a best practice)

- Reference specific campaign names and numbers
- Use traffic light language: 🟢 = great, 🟡 = careful, 🔴 = problem
- Keep the total response under 500 words
- Be direct and actionable, not vague`;

// GET: Return today's analysis (or latest available)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('daily_analysis')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ analysis: null, message: 'No analysis available yet' });
    }

    return NextResponse.json({
      analysis: data.content,
      date: data.date,
      createdAt: data.created_at,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: Generate new analysis (called by Vercel Cron or manually)
export async function POST(request: Request) {
  // Skip during build time to avoid circular dependency
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
    return NextResponse.json({ error: 'Not available during build' }, { status: 503 });
  }

  // Verify cron secret or allow manual trigger
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 400 });
  }

  try {
    // 1. Fetch campaign data from our own API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'https://ads-dashboard-vicus.vercel.app';
    
    const campaignRes = await fetch(`${baseUrl}/api/campaigns`, { 
      cache: 'no-store',
      headers: { 'User-Agent': 'internal-cron' }
    });
    const campaignData = await campaignRes.json();

    if (!campaignData.campaigns || campaignData.campaigns.length === 0) {
      return NextResponse.json({ error: 'No campaign data available' }, { status: 400 });
    }

    // 2. Format campaign data for the prompt
    const summary = campaignData.campaigns.map((c: any) => {
      const platform = c.platform === 'meta' ? 'Meta' : 'MercadoLibre';
      const status = c.status === 'active' ? '🟢 Activa' : '⏸ Pausada';
      const currency = c.platform === 'meli' ? 'ARS' : 'USD';
      return `
**${c.name}** (${platform} — ${status})
- Gastado: ${currency} ${c.spent.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
- Ingresos: ${currency} ${c.revenue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
- ROAS: ${c.roas.toFixed(2)}x
- CTR: ${c.ctr.toFixed(2)}%
- CPC: ${currency} ${c.cpc.toFixed(2)}
- Conversiones: ${c.conversions}
- Costo por resultado: ${currency} ${c.costPerResult.toFixed(2)}
- Tendencia ROAS (últimos días): ${c.trend.map((t: number) => t.toFixed(1)).join(' → ')}`;
    }).join('\n');

    const userMessage = `Aquí están los datos de rendimiento de hoy para todas las campañas de Vicus Footwear:\n${summary}\n\nGenera el plan de acción diario.`;

    // 3. Call Claude Sonnet
    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const analysisText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    // 4. Store in Supabase (upsert by date)
    const today = new Date().toISOString().split('T')[0];
    const { error: upsertError } = await supabase
      .from('daily_analysis')
      .upsert(
        { date: today, content: analysisText, campaign_data: campaignData },
        { onConflict: 'date' }
      );

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
    }

    return NextResponse.json({
      success: true,
      date: today,
      analysis: analysisText,
      tokensUsed: response.usage,
    });
  } catch (err) {
    console.error('Daily analysis error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
