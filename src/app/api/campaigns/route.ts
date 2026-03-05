import { NextResponse } from 'next/server';

const META_BASE = 'https://graph.facebook.com/v19.0';

async function fetchMetaCampaigns() {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !adAccountId) return [];

  try {
    // Get campaigns
    const campRes = await fetch(
      `${META_BASE}/${adAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,objective&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    );
    const campData = await campRes.json();
    if (campData.error) { console.error('Meta campaigns error:', campData.error); return []; }

    // Get insights (last 7 days)
    const insRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type&date_preset=last_7d&level=campaign&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    );
    const insData = await insRes.json();

    // Get daily breakdown for trends
    const dailyRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,spend,actions,action_values&date_preset=last_7d&level=campaign&time_increment=1&limit=200&access_token=${token}`,
      { cache: 'no-store' }
    );
    const dailyData = await dailyRes.json();

    // Get adset breakdown
    const adsetRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=adset_id,adset_name,campaign_id,spend,clicks,ctr,actions,action_values&date_preset=last_7d&level=adset&limit=100&access_token=${token}`,
      { cache: 'no-store' }
    );
    const adsetData = await adsetRes.json();

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (campData.data || []).map((camp: any) => {
      const insight = (insData.data || []).find((i: any) => i.campaign_id === camp.id);
      if (!insight) return null;

      const spend = parseFloat(insight.spend || '0');
      const impressions = parseInt(insight.impressions || '0');
      const reach = parseInt(insight.reach || '0');
      const clicks = parseInt(insight.clicks || '0');
      const ctr = parseFloat(insight.ctr || '0');
      const cpc = parseFloat(insight.cpc || '0');
      const cpm = parseFloat(insight.cpm || '0');
      const frequency = parseFloat(insight.frequency || '0');

      // Extract purchases
      const purchaseTypes = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase', 'web_in_store_purchase'];
      const findAction = (actions: any[], types: string[]) =>
        actions?.find((a: any) => types.includes(a.action_type));

      const purchaseAction = findAction(insight.actions, purchaseTypes);
      const purchaseValue = findAction(insight.action_values, purchaseTypes);

      const conversions = parseInt(purchaseAction?.value || '0');
      const revenue = parseFloat(purchaseValue?.value || '0');
      const roas = spend > 0 ? revenue / spend : 0;
      const costPerResult = conversions > 0 ? spend / conversions : 0;

      // Daily ROAS trend
      const dailyInsights = (dailyData.data || [])
        .filter((d: any) => d.campaign_id === camp.id)
        .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''));

      const trend = dailyInsights.map((d: any) => {
        const dSpend = parseFloat(d.spend || '0');
        const dRevVal = findAction(d.action_values, purchaseTypes);
        const dRev = parseFloat(dRevVal?.value || '0');
        return dSpend > 0 ? dRev / dSpend : 0;
      });

      const trendLabels = dailyInsights.map((d: any) => {
        const date = new Date(d.date_start);
        return dayNames[date.getDay()];
      });

      // Adsets
      const adsets = (adsetData.data || [])
        .filter((a: any) => a.campaign_id === camp.id)
        .map((as: any) => {
          const asSpend = parseFloat(as.spend || '0');
          const asPurchase = findAction(as.actions, purchaseTypes);
          const asRevVal = findAction(as.action_values, purchaseTypes);
          const asConv = parseInt(asPurchase?.value || '0');
          const asRev = parseFloat(asRevVal?.value || '0');
          return {
            name: as.adset_name,
            spent: asSpend,
            conversions: asConv,
            roas: asSpend > 0 ? asRev / asSpend : 0,
            ctr: parseFloat(as.ctr || '0'),
          };
        });

      const budget = parseFloat(camp.daily_budget || camp.lifetime_budget || '0') / 100;

      return {
        id: camp.id,
        platform: 'meta',
        name: camp.name,
        status: camp.status === 'ACTIVE' ? 'active' : 'paused',
        budget,
        spent: spend,
        impressions,
        reach,
        clicks,
        ctr,
        cpc,
        cpm,
        frequency,
        conversions,
        revenue,
        roas,
        costPerResult,
        trend: trend.length > 0 ? trend : [roas],
        trendLabels: trendLabels.length > 0 ? trendLabels : ['Hoy'],
        adSets: adsets,
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('Meta fetch error:', err);
    return [];
  }
}

async function fetchMeliCampaigns() {
  const token = process.env.MELI_ACCESS_TOKEN;
  const userId = process.env.MELI_USER_ID;
  if (!token || !userId) return [];

  try {
    const res = await fetch(
      `https://api.mercadolibre.com/advertising/advertisers/${userId}/product_ads/campaigns?limit=20&metrics_summary=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'api-version': '2',
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.results || data.campaigns || []);

    return results.map((c: any) => {
      const metrics = c.metrics || c.metrics_summary || {};
      const spent = metrics.cost || metrics.total_amount || 0;
      const impressions = metrics.prints || metrics.impressions || 0;
      const clicks = metrics.clicks || 0;
      const revenue = metrics.revenue || 0;
      const conversions = metrics.units_sold || metrics.conversions || 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spent / clicks : 0;
      const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
      const roas = spent > 0 ? revenue / spent : 0;
      const costPerResult = conversions > 0 ? spent / conversions : 0;

      return {
        id: c.id || c.campaign_id,
        platform: 'meli',
        name: c.name || c.title || `Campaña ${c.id}`,
        status: c.status === 'active' ? 'active' : 'paused',
        budget: c.daily_budget || c.budget || 0,
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
        trend: [roas],
        trendLabels: ['Hoy'],
        adSets: [],
      };
    });
  } catch (err) {
    console.error('MeLi fetch error:', err);
    return [];
  }
}

export async function GET() {
  const [meta, meli] = await Promise.all([
    fetchMetaCampaigns(),
    fetchMeliCampaigns(),
  ]);

  return NextResponse.json({
    campaigns: [...meta, ...meli],
    sources: {
      meta: { count: meta.length, connected: !!process.env.META_ACCESS_TOKEN },
      meli: { count: meli.length, connected: !!process.env.MELI_ACCESS_TOKEN },
    },
    updatedAt: new Date().toISOString(),
  });
}
