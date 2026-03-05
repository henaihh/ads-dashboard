// MeLi token refresh utility
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getMeliToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedToken && now < tokenExpiry) {
    return cachedToken; // This is safe because we check cachedToken is truthy
  }

  // Try to use the current token first
  const currentToken = process.env.MELI_ACCESS_TOKEN;
  if (currentToken) {
    try {
      // Test if current token works
      const testRes = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      
      if (testRes.ok) {
        cachedToken = currentToken;
        tokenExpiry = now + (5.5 * 60 * 60 * 1000); // 5.5 hours (tokens expire in 6h)
        return currentToken;
      }
    } catch {
      // Current token doesn't work, need to refresh
    }
  }

  // Refresh token
  const refreshToken = process.env.MELI_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('No MeLi refresh token available. Please re-authenticate at /api/auth/meli');
  }

  try {
    const refreshRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.MELI_APP_ID!,
        client_secret: process.env.MELI_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }),
    });

    if (!refreshRes.ok) {
      const errorData = await refreshRes.json();
      throw new Error(`Token refresh failed: ${errorData.message || 'Unknown error'}. Please re-authenticate at /api/auth/meli`);
    }

    const tokenData = await refreshRes.json();
    cachedToken = tokenData.access_token;
    tokenExpiry = now + (5.5 * 60 * 60 * 1000); // 5.5 hours

    console.log('🔄 MeLi token refreshed successfully');
    
    // TODO: In production, you'd want to update the environment variables here
    // For now, log the new tokens so they can be updated manually
    console.log('New tokens:', {
      MELI_ACCESS_TOKEN: tokenData.access_token,
      MELI_REFRESH_TOKEN: tokenData.refresh_token,
    });

    return cachedToken!; // We just set it above, so it's safe
  } catch (error) {
    throw new Error(`Failed to refresh MeLi token: ${error}`);
  }
}