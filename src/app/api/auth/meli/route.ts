import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate PKCE challenge
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export async function GET() {
  const appId = process.env.MELI_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meli/callback`;

  const { verifier, challenge } = generatePKCE();

  // Store verifier in a cookie so callback can use it
  const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('meli_code_verifier', verifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
