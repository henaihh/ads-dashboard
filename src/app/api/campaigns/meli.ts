import { getMeliToken } from '@/lib/meli-auth';

const BASE = 'https://api.mercadolibre.com';
const METRICS = 'clicks,prints,ctr,cost,cpc,acos,roas,units_quantity,direct_amount,indirect_amount,total_amount';

async function meliGet(path: string, token: string, extraHeaders?: Record<string, string>) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'api-version': '2', ...extraHeaders },
    cache: 'no-store',
  });
  return res.json();
}

export async function fetchMeliCampaigns(paramDateFrom?: string, paramDateTo?: string) {
  let token: string;
  
  try {
    token = await getMeliToken();
  } catch (error) {
    console.error('MeLi auth failed in main campaigns:', error);
    return [];
  }

  try {
    // 1. Get advertiser_id
    const advData = await meliGet('/advertising/advertisers?product_id=PADS', token, { 'Api-Version': '1' });
    const advertisers = advData.advertisers || [];
    if (advertisers.length === 0) return [];
    
    const advertiser = advertisers[0];
    const advertiserId = advertiser.advertiser_id;

    // 2. Get campaigns with metrics
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateFrom = paramDateFrom || monthAgo.toISOString().split('T')[0];
    const dateTo = paramDateTo || today.toISOString().split('T')[0];

    const campsData = await meliGet(
      `/advertising/advertisers/${advertiserId}/product_ads/campaigns?limit=50&offset=0&date_from=${dateFrom}&date_to=${dateTo}&metrics=${METRICS}&metrics_summary=true`,
      token,
    );

    const campaignList = campsData.results || [];

    const campaigns = [];

    for (const camp of campaignList) {
      const m = camp.metrics || {};
      const spent = m.cost || 0;
      const impressions = m.prints || 0;
      const clicks = m.clicks || 0;
      const revenue = (m.direct_amount || 0) + (m.indirect_amount || 0);
      const conversions = m.units_quantity || 0;

      const ctr = m.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0);
      const cpc = m.cpc || (clicks > 0 ? spent / clicks : 0);
      const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
      const roas = m.roas || (spent > 0 ? revenue / spent : 0);
      const costPerResult = conversions > 0 ? spent / conversions : 0;

      // 3. Get daily metrics for trend
      let trend: number[] = [roas];
      let trendLabels: string[] = ['Hoy'];
      let dailyBreakdown: { date: string; spent: number; revenue: number; conversions: number; clicks: number; impressions: number }[] = [];
      try {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dailyData = await meliGet(
          `/advertising/product_ads/campaigns/${camp.id}?date_from=${weekAgo.toISOString().split('T')[0]}&date_to=${dateTo}&metrics=${METRICS}&aggregation_type=DAILY`,
          token,
        );
        const dailyResults = Array.isArray(dailyData) ? dailyData : (dailyData.results || []);
        if (dailyResults.length > 0) {
          trend = dailyResults.map((d: any) => {
            const dCost = d.cost || 0;
            const dRev = (d.direct_amount || 0) + (d.indirect_amount || 0);
            return dCost > 0 ? dRev / dCost : 0;
          });
          trendLabels = dailyResults.map((d: any) => {
            if (d.date) {
              const dt = new Date(d.date);
              return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dt.getDay()];
            }
            return '';
          });
          dailyBreakdown = dailyResults.map((d: any) => ({
            date: d.date || '',
            spent: d.cost || 0,
            revenue: (d.direct_amount || 0) + (d.indirect_amount || 0),
            conversions: d.units_quantity || 0,
            clicks: d.clicks || 0,
            impressions: d.prints || 0,
          }));
        }
      } catch { /* trend stays as default */ }

      // 4. Get items (ads) in this campaign for bar charts
      const adSets: { name: string; spent: number; conversions: number; roas: number; ctr: number }[] = [];
      try {
        const itemsData = await meliGet(
          `/advertising/advertisers/${advertiserId}/product_ads/items?limit=5&offset=0&date_from=${dateFrom}&date_to=${dateTo}&metrics=${METRICS}&filters[campaign_id]=${camp.id}`,
          token,
        );
        const items = itemsData.results || [];
        for (const item of items) {
          const im = item.metrics || item.metrics_summary || {};
          const iSpent = im.cost || 0;
          const iClicks = im.clicks || 0;
          const iImpressions = im.prints || 0;
          const iRevenue = (im.direct_amount || 0) + (im.indirect_amount || 0);
          const iConversions = im.units_quantity || 0;
          if (iSpent > 0 || iClicks > 0) {
            adSets.push({
              name: item.title || item.item_id || `Item ${item.id}`,
              spent: iSpent,
              conversions: iConversions,
              roas: iSpent > 0 ? iRevenue / iSpent : 0,
              ctr: iImpressions > 0 ? (iClicks / iImpressions) * 100 : 0,
            });
          }
        }
      } catch { /* adSets stays empty */ }

      campaigns.push({
        id: camp.id,
        platform: 'meli' as const,
        name: camp.name || `Campaña ${camp.id}`,
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
        dailyBreakdown,
      });
    }

    return campaigns;
  } catch (err) {
    console.error('MeLi fetch error:', err);
    return [];
  }
}
