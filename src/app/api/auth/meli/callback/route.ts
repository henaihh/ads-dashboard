import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meli/callback`;

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MELI_APP_ID!,
        client_secret: process.env.MELI_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: 'Token exchange failed', details: data }, { status: 400 });
    }

    // In production, store these in DB. For now, display them to copy to env vars.
    return NextResponse.json({
      message: '✅ MercadoLibre conectado! Copiá estos valores a las variables de entorno en Vercel:',
      MELI_ACCESS_TOKEN: data.access_token,
      MELI_REFRESH_TOKEN: data.refresh_token,
      MELI_USER_ID: data.user_id,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to exchange code', details: String(err) }, { status: 500 });
  }
}
