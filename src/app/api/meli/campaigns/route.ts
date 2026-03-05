import { NextResponse } from 'next/server';

const BASE = 'https://api.mercadolibre.com';

export async function GET() {
  const token = process.env.MELI_ACCESS_TOKEN;
  const userId = process.env.MELI_USER_ID;

  if (!token || !userId) {
    return NextResponse.json({ error: 'MeLi credentials not configured', configured: { token: !!token, userId: !!userId } }, { status: 400 });
  }

  try {
    // 1. Get campaigns
    const campaignsRes = await fetch(
      `${BASE}/advertising/advertisers/${userId}/campaigns?status=active,paused`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      return NextResponse.json({ error: 'MeLi API error', details: campaignsData }, { status: 400 });
    }

    const campaigns = [];
    const campaignList = Array.isArray(campaignsData) ? campaignsData : (campaignsData.results || []);

    for (const camp of campaignList) {
      try {
        // 2. Get metrics for each campaign (last 7 days)
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dateFrom = weekAgo.toISOString().split('T')[0];
        const dateTo = today.toISOString().split('T')[0];

        const metricsRes = await fetch(
          `${BASE}/advertising/advertisers/${userId}/campaigns/${camp.id}/metrics?date_from=${dateFrom}&date_to=${dateTo}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        const metrics = await metricsRes.json();

        // Daily breakdown for trends
        const dailyRes = await fetch(
          `${BASE}/advertising/advertisers/${userId}/campaigns/${camp.id}/metrics?date_from=${dateFrom}&date_to=${dateTo}&granularity=day`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        const dailyMetrics = await dailyRes.json();

        const spent = metrics.cost || metrics.total_amount || 0;
        const impressions = metrics.prints || metrics.impressions || 0;
        const clicks = metrics.clicks || 0;
        const revenue = metrics.revenue || metrics.total_value || 0;
        const conversions = metrics.units_sold || metrics.conversions || 0;

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? spent / clicks : 0;
        const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
        const roas = spent > 0 ? revenue / spent : 0;
        const costPerResult = conversions > 0 ? spent / conversions : 0;

        // Build daily ROAS trend
        const dailyArray = Array.isArray(dailyMetrics) ? dailyMetrics : (dailyMetrics.results || []);
        const trend = dailyArray.map((d: any) => {
          const dCost = d.cost || d.total_amount || 0;
          const dRev = d.revenue || d.total_value || 0;
          return dCost > 0 ? dRev / dCost : 0;
        });

        // 3. Get product-level ads for this campaign (for bar charts)
        const adSets: { name: string; spent: number; conversions: number; roas: number; ctr: number }[] = [];
        try {
          const adsRes = await fetch(
            `${BASE}/advertising/advertisers/${userId}/campaigns/${camp.id}/ads?limit=10`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            }
          );
          const adsData = await adsRes.json();
          const adsList = Array.isArray(adsData) ? adsData : (adsData.results || adsData.paging ? (adsData.results || []) : []);

          for (const ad of adsList.slice(0, 5)) {
            try {
              const adMetricsRes = await fetch(
                `${BASE}/advertising/advertisers/${userId}/ads/${ad.id}/metrics?date_from=${dateFrom}&date_to=${dateTo}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: 'no-store',
                }
              );
              const adM = await adMetricsRes.json();
              const aSpent = adM.cost || adM.total_amount || 0;
              const aClicks = adM.clicks || 0;
              const aImpressions = adM.prints || adM.impressions || 0;
              const aRevenue = adM.revenue || adM.total_value || 0;
              const aConversions = adM.units_sold || adM.conversions || 0;
              if (aSpent > 0 || aClicks > 0) {
                adSets.push({
                  name: ad.title || ad.item_id || `Ad ${ad.id}`,
                  spent: aSpent,
                  conversions: aConversions,
                  roas: aSpent > 0 ? aRevenue / aSpent : 0,
                  ctr: aImpressions > 0 ? (aClicks / aImpressions) * 100 : 0,
                });
              }
            } catch {
              // skip individual ad metrics failures
            }
          }
        } catch {
          // adSets stays empty if endpoint not available
        }

        campaigns.push({
          id: camp.id,
          platform: 'meli' as const,
          name: camp.name || camp.title || `Campaña ${camp.id}`,
          status: camp.status === 'active' ? 'active' : 'paused',
          budget: camp.daily_budget || camp.budget || 0,
          spent,
          impressions,
          reach: impressions,
          clicks,
          ctr,
          cpc,
          cpm,
          frequency: 1.0,
          conversions,
          revenue,
          roas,
          costPerResult,
          trend: trend.length > 0 ? trend : [roas],
          trendLabels: dailyArray.map((_: any, i: number) => `D${i + 1}`),
          adSets,
        });
      } catch {
        // Skip campaigns that fail to fetch metrics
      }
    }

    return NextResponse.json({ campaigns });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch MeLi data', details: String(err) }, { status: 500 });
  }
}
