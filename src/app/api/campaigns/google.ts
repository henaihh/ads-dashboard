const GOOGLE_ADS_API_VERSION = 'v22';
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const GOOGLE_OAUTH_TOKEN_URL = 'https://www.googleapis.com/oauth2/v3/token';

function normalizeCustomerId(id?: string) {
  return id?.replace(/-/g, '').trim();
}

function microsToCurrency(micros?: string | number | null) {
  return Number(micros || 0) / 1_000_000;
}

function getDateRange(dateFrom?: string, dateTo?: string): { since: string; until: string } {
  if (dateFrom && dateTo) return { since: dateFrom, until: dateTo };
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { since: weekAgo.toISOString().split('T')[0], until: today.toISOString().split('T')[0] };
}

function googleDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid Google Ads date: ${date}`);
  }
  return date;
}

function spanishDayLabel(dateString: string) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const date = new Date(`${dateString}T00:00:00`);
  return dayNames[date.getDay()] || dateString;
}

async function getGoogleAdsAccessToken() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('Google Ads OAuth error:', data.error || data.error_description || data);
    return null;
  }

  return data.access_token as string;
}

async function googleAdsSearchStream(query: string, accessToken: string) {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = normalizeCustomerId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

  if (!developerToken || !customerId) return [];

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

  const res = await fetch(`${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:searchStream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Google Ads API error:', data.error || data);
    return [];
  }

  // searchStream returns an array of response chunks, each chunk containing results.
  return Array.isArray(data) ? data.flatMap((chunk: any) => chunk.results || []) : [];
}

export async function fetchGoogleCampaigns(dateFrom?: string, dateTo?: string) {
  const accessToken = await getGoogleAdsAccessToken();
  if (!accessToken) return [];

  const { since, until } = getDateRange(dateFrom, dateTo);
  const start = googleDate(since);
  const end = googleDate(until);

  try {
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `;

    const dailyQuery = `
      SELECT
        campaign.id,
        segments.date,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date ASC
      LIMIT 1000
    `;

    const adGroupQuery = `
      SELECT
        campaign.id,
        ad_group.name,
        metrics.cost_micros,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions,
        metrics.conversions_value
      FROM ad_group
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 500
    `;

    const [campaignRows, dailyRows, adGroupRows] = await Promise.all([
      googleAdsSearchStream(campaignQuery, accessToken),
      googleAdsSearchStream(dailyQuery, accessToken),
      googleAdsSearchStream(adGroupQuery, accessToken),
    ]);

    return campaignRows.map((row: any) => {
      const campaignId = Number(row.campaign?.id || 0);
      const cost = microsToCurrency(row.metrics?.costMicros);
      const impressions = Number(row.metrics?.impressions || 0);
      const clicks = Number(row.metrics?.clicks || 0);
      const conversions = Number(row.metrics?.conversions || 0);
      const revenue = Number(row.metrics?.conversionsValue || 0);
      const roas = cost > 0 ? revenue / cost : 0;
      const ctr = Number(row.metrics?.ctr || 0) * 100;
      const cpc = microsToCurrency(row.metrics?.averageCpc);
      const cpm = microsToCurrency(row.metrics?.averageCpm);

      const dailyBreakdown = dailyRows
        .filter((d: any) => Number(d.campaign?.id || 0) === campaignId)
        .map((d: any) => {
          const spent = microsToCurrency(d.metrics?.costMicros);
          const dayRevenue = Number(d.metrics?.conversionsValue || 0);
          return {
            date: d.segments?.date,
            spent,
            revenue: dayRevenue,
            conversions: Number(d.metrics?.conversions || 0),
            clicks: Number(d.metrics?.clicks || 0),
            impressions: Number(d.metrics?.impressions || 0),
          };
        });

      const adSets = adGroupRows
        .filter((a: any) => Number(a.campaign?.id || 0) === campaignId)
        .map((a: any) => {
          const spent = microsToCurrency(a.metrics?.costMicros);
          const adRevenue = Number(a.metrics?.conversionsValue || 0);
          return {
            name: a.adGroup?.name || 'Grupo de anuncios',
            spent,
            conversions: Number(a.metrics?.conversions || 0),
            roas: spent > 0 ? adRevenue / spent : 0,
            ctr: Number(a.metrics?.ctr || 0) * 100,
          };
        });

      return {
        id: campaignId,
        platform: 'google',
        name: row.campaign?.name || `Campaña ${campaignId}`,
        status: row.campaign?.status === 'ENABLED' ? 'active' : 'paused',
        budget: microsToCurrency(row.campaignBudget?.amountMicros),
        spent: cost,
        impressions,
        reach: impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        frequency: 1,
        conversions,
        revenue,
        roas,
        costPerResult: conversions > 0 ? cost / conversions : 0,
        trend: dailyBreakdown.map((d: any) => d.spent > 0 ? d.revenue / d.spent : 0),
        trendLabels: dailyBreakdown.map((d: any) => spanishDayLabel(d.date)),
        adSets,
        dailyBreakdown,
      };
    });
  } catch (err) {
    console.error('Google Ads fetch error:', err);
    return [];
  }
}
