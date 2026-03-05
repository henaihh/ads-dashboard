import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `Sos un estratega experto en publicidad digital. El usuario maneja campañas en Meta Ads y MercadoLibre para una empresa de calzado en Argentina.

REGLAS:
- Respondé siempre en español argentino (vos, tuteo)
- Sé específico y táctico — no des consejos genéricos
- Si te dan datos de una campaña, analizalos en detalle
- Sugerí acciones concretas con números (ej: "bajá el bid un 20%", "aumentá presupuesto de $1000 a $1300")
- Explicá conceptos técnicos de forma simple si es necesario
- Mantené respuestas concisas (máximo 300 palabras)
- Usá emojis para señales: 🟢 bien, 🟡 atención, 🔴 problema
- Siempre terminá con 1-2 acciones inmediatas que el usuario puede hacer HOY`;

export async function POST(request: NextRequest) {
  try {
    const { message, campaignContext, dateRange } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    let userMessage = message;

    if (campaignContext) {
      userMessage += `\n\n📊 Datos de la campaña "${campaignContext.name}" (${campaignContext.platform}):
- ROAS: ${campaignContext.roas?.toFixed(2)}x
- CTR: ${campaignContext.ctr?.toFixed(1)}%
- CPC: $${campaignContext.cpc?.toFixed(2)}
- CPM: $${campaignContext.cpm?.toFixed(2)}
- Frecuencia: ${campaignContext.frequency?.toFixed(1)}
- Gastado: $${campaignContext.spent?.toLocaleString()} de $${campaignContext.budget?.toLocaleString()} presupuesto
- Ingresos: $${campaignContext.revenue?.toLocaleString()}
- Conversiones: ${campaignContext.conversions}
- Costo/Resultado: $${campaignContext.costPerResult?.toFixed(2)}`;

      if (campaignContext.adSets?.length) {
        userMessage += '\n\nAd Sets:';
        campaignContext.adSets.forEach((as: any) => {
          userMessage += `\n- "${as.name}": ROAS ${as.roas?.toFixed(1)}x, CTR ${as.ctr?.toFixed(1)}%, Gastado $${as.spent?.toLocaleString()}, ${as.conversions} conv.`;
        });
      }
    }

    if (dateRange) {
      userMessage += `\n\nPeríodo: ${dateRange}`;
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
