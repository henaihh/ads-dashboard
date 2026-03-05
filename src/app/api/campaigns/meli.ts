const BASE = 'https://api.mercadolibre.com';

export async function fetchMeliCampaigns() {
  const token = process.env.MELI_ACCESS_TOKEN;
  if (!token) return [];

  try {
    // 1. Get advertiser ID
    const advRes = await fetch(`${BASE}/advertising/advertisers?product_id=PADS`, {
      headers: { Authorization: `Bearer ${token}`, 'Api-Version': '1' },
      cache: 'no-store',
    });
    const advData = await advRes.json();
    const advertiser = advData.advertisers?.[0];
    if (!advertiser) return [];

    const advId = advertiser.advertiser_id;
    const siteId = advertiser.site_id || 'MLA';

    // 2. Get campaigns with metrics (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateFrom = weekAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    const campRes = await fetch(
      `${BASE}/marketplace/advertising/${siteId}/advertisers/${advId}/product_ads/campaigns/search?limit=50&date_from=${dateFrom}&date_to=${dateTo}&metrics_summary=true&metrics=clicks,prints,cost,cpc,acos,direct_amount,indirect_amount,total_amount,units_quantity,direct_units_quantity,indirect_units_quantity`,
      {
        headers: { Authorization: `Bearer ${token}`, 'api-version': '2' },
        cache: 'no-store',
      }
    );
    const campData = await campRes.json();
    const results = campData.results || [];

    // 3. Get daily metrics for trends
    const campaigns = [];

    for (const camp of results) {
      const m = camp.metrics || {};
      const spent = m.cost || 0;
      const impressions = m.prints || 0;
      const clicks = m.clicks || 0;
      const revenue = m.total_amount || 0;
      const conversions = m.units_quantity || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = m.cpc || (clicks > 0 ? spent / clicks : 0);
      const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
      const roas = spent > 0 ? revenue / spent : 0;
      const costPerResult = conversions > 0 ? spent / conversions : 0;

      // Try to get daily breakdown for trend
      let trend = [roas];
      let trendLabels = ['Hoy'];
      try {
        const dailyRes = await fetch(
          `${BASE}/marketplace/advertising/${siteId}/advertisers/${advId}/product_ads/campaigns/search?campaign_id=${camp.id}&date_from=${dateFrom}&date_to=${dateTo}&metrics_summary=true&metrics=clicks,prints,cost,total_amount&granularity=day`,
          {
            headers: { Authorization: `Bearer ${token}`, 'api-version': '2' },
            cache: 'no-store',
          }
        );
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          // Process daily data if available
          const daily = dailyData.results?.[0]?.daily_metrics || [];
          if (daily.length > 0) {
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            trend = daily.map((d: any) => {
              const dCost = d.cost || 0;
              const dRev = d.total_amount || 0;
              return dCost > 0 ? dRev / dCost : 0;
            });
            trendLabels = daily.map((d: any) => {
              if (d.date) {
                const date = new Date(d.date);
                return dayNames[date.getDay()];
              }
              return '';
            });
          }
        }
      } catch {
        // Daily breakdown not available, use single point
      }

      // Get items (promoted products) in this campaign for bar charts
      const adSets: { name: string; spent: number; conversions: number; roas: number; ctr: number }[] = [];
      try {
        const itemsRes = await fetch(
          `${BASE}/advertising/advertisers/${advId}/product_ads/items?limit=5&offset=0&date_from=${dateFrom}&date_to=${dateTo}&metrics=${encodeURIComponent('clicks,prints,cost,total_amount,units_quantity')}&filters[campaign_id]=${camp.id}`,
          {
            headers: { Authorization: `Bearer ${token}`, 'api-version': '2' },
            cache: 'no-store',
          }
        );
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          for (const item of (itemsData.results || []).slice(0, 5)) {
            const im = item.metrics || item.metrics_summary || {};
            const iSpent = im.cost || 0;
            const iClicks = im.clicks || 0;
            const iPrints = im.prints || 0;
            const iRevenue = im.total_amount || 0;
            const iConv = im.units_quantity || 0;
            if (iSpent > 0 || iClicks > 0) {
              adSets.push({
                name: item.title || item.item_id || `Item ${item.id}`,
                spent: iSpent,
                conversions: iConv,
                roas: iSpent > 0 ? iRevenue / iSpent : 0,
                ctr: iPrints > 0 ? (iClicks / iPrints) * 100 : 0,
              });
            }
          }
        }
      } catch { /* items endpoint not available */ }

      campaigns.push({
        id: camp.id,
        platform: 'meli' as const,
        name: camp.name,
        status: camp.status === 'active' ? 'active' : 'paused',
        budget: camp.budget || 0,
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
        trend,
        trendLabels,
        adSets,
      });
    }

    return campaigns;
  } catch (err) {
    console.error('MeLi fetch error:', err);
    return [];
  }
}
