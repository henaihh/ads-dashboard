import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const codeVerifier = req.cookies.get('meli_code_verifier')?.value;

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  if (!codeVerifier) {
    return NextResponse.json({ error: 'No code_verifier found. Please start the auth flow again at /api/auth/meli' }, { status: 400 });
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
        code_verifier: codeVerifier,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: 'Token exchange failed', details: data }, { status: 400 });
    }

    // Clear the cookie
    const response = NextResponse.json({
      message: '✅ MercadoLibre conectado! Copiá estos valores:',
      MELI_ACCESS_TOKEN: data.access_token,
      MELI_REFRESH_TOKEN: data.refresh_token,
      MELI_USER_ID: data.user_id,
      expires_in_seconds: data.expires_in,
    });
    response.cookies.delete('meli_code_verifier');

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Failed to exchange code', details: String(err) }, { status: 500 });
  }
}
