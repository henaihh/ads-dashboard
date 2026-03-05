import { NextResponse } from 'next/server';

// Redirects user to MercadoLibre OAuth
export async function GET() {
  const appId = process.env.MELI_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meli/callback`;

  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
