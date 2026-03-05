import { NextResponse } from 'next/server';

const META_BASE = 'https://graph.facebook.com/v19.0';

function getDateRange(dateFrom?: string, dateTo?: string): { since: string; until: string } {
  if (dateFrom && dateTo) return { since: dateFrom, until: dateTo };
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { since: weekAgo.toISOString().split('T')[0], until: today.toISOString().split('T')[0] };
}

async function fetchMetaCampaigns(dateFrom?: string, dateTo?: string) {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  if (!token || !adAccountId) return [];

  const { since, until } = getDateRange(dateFrom, dateTo);
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));

  try {
    // Get campaigns
    const campRes = await fetch(
      `${META_BASE}/${adAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,objective&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    );
    const campData = await campRes.json();
    if (campData.error) { console.error('Meta campaigns error:', campData.error); return []; }

    // Get insights
    const insRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type&time_range=${timeRange}&level=campaign&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    );
    const insData = await insRes.json();

    // Get daily breakdown for trends
    const dailyRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,spend,impressions,clicks,actions,action_values&time_range=${timeRange}&level=campaign&time_increment=1&limit=500&access_token=${token}`,
      { cache: 'no-store' }
    );
    const dailyData = await dailyRes.json();

    // Get adset breakdown
    const adsetRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=adset_id,adset_name,campaign_id,spend,clicks,ctr,actions,action_values&time_range=${timeRange}&level=adset&limit=100&access_token=${token}`,
      { cache: 'no-store' }
    );
    const adsetData = await adsetRes.json();

    // Get age+gender breakdown (impressions + conversions)
    const ageGenderRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,impressions,clicks,spend,actions&time_range=${timeRange}&level=campaign&breakdowns=age,gender&limit=500&access_token=${token}`,
      { cache: 'no-store' }
    );
    const ageGenderData = await ageGenderRes.json();

    // Get region breakdown (impressions + conversions)
    const regionRes = await fetch(
      `${META_BASE}/${adAccountId}/insights?fields=campaign_id,impressions,actions&time_range=${timeRange}&level=campaign&breakdowns=region&limit=500&access_token=${token}`,
      { cache: 'no-store' }
    );
    const regionData = await regionRes.json();

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

      // Daily breakdown for charts
      const dailyBreakdown = dailyInsights.map((d: any) => {
        const dSpend = parseFloat(d.spend || '0');
        const dImpressions = parseInt(d.impressions || '0');
        const dClicks = parseInt(d.clicks || '0');
        const dPurchase = findAction(d.actions, purchaseTypes);
        const dRevVal = findAction(d.action_values, purchaseTypes);
        const dConv = parseInt(dPurchase?.value || '0');
        const dRev = parseFloat(dRevVal?.value || '0');
        return { date: d.date_start, spent: dSpend, revenue: dRev, conversions: dConv, clicks: dClicks, impressions: dImpressions };
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

      // Demographics - age + gender (both impressions and conversions)
      const campAgeGender = (ageGenderData.data || []).filter((d: any) => d.campaign_id === camp.id);
      const genderImpMap: Record<string, number> = {};
      const genderConvMap: Record<string, number> = {};
      const ageImpMap: Record<string, number> = {};
      const ageConvMap: Record<string, number> = {};
      
      for (const row of campAgeGender) {
        const imp = parseInt(row.impressions || '0');
        const purchaseAction = findAction(row.actions, purchaseTypes);
        const conv = parseInt(purchaseAction?.value || '0');
        
        const g = row.gender === 'male' ? 'Hombres' : row.gender === 'female' ? 'Mujeres' : 'Desconocido';
        genderImpMap[g] = (genderImpMap[g] || 0) + imp;
        genderConvMap[g] = (genderConvMap[g] || 0) + conv;
        
        const age = row.age || 'Otro';
        ageImpMap[age] = (ageImpMap[age] || 0) + imp;
        ageConvMap[age] = (ageConvMap[age] || 0) + conv;
      }

      // Demographics - region (both impressions and conversions)
      const campRegion = (regionData.data || []).filter((d: any) => d.campaign_id === camp.id);
      const regionImpMap: Record<string, number> = {};
      const regionConvMap: Record<string, number> = {};
      
      for (const row of campRegion) {
        const imp = parseInt(row.impressions || '0');
        const purchaseAction = findAction(row.actions, purchaseTypes);
        const conv = parseInt(purchaseAction?.value || '0');
        
        const region = row.region || 'Desconocido';
        regionImpMap[region] = (regionImpMap[region] || 0) + imp;
        regionConvMap[region] = (regionConvMap[region] || 0) + conv;
      }

      const demographics = {
        gender: {
          impressions: Object.entries(genderImpMap).map(([label, value]) => ({ label, value })),
          conversions: Object.entries(genderConvMap).map(([label, value]) => ({ label, value })),
        },
        age: {
          impressions: Object.entries(ageImpMap).map(([label, value]) => ({ label, value })),
          conversions: Object.entries(ageConvMap).map(([label, value]) => ({ label, value })),
        },
        region: {
          impressions: Object.entries(regionImpMap).map(([label, value]) => ({ label, value })),
          conversions: Object.entries(regionConvMap).map(([label, value]) => ({ label, value })),
        },
      };

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
        demographics,
        dailyBreakdown,
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('Meta fetch error:', err);
    return [];
  }
}

// MeLi campaigns imported from separate file
import { fetchMeliCampaigns } from './meli';

function getPreviousPeriod(dateFrom: string, dateTo: string): { prevFrom: string; prevTo: string } {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const days = Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - days * 24 * 60 * 60 * 1000);
  return { prevFrom: prevFrom.toISOString().split('T')[0], prevTo: prevTo.toISOString().split('T')[0] };
}

function computeAggregates(campaigns: any[]) {
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const avgCTR = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.ctr, 0) / campaigns.length : 0;
  const avgCPC = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.cpc, 0) / campaigns.length : 0;
  return { totalSpent, totalRevenue, totalConversions, avgRoas, avgCTR, avgCPC };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  const [meta, meli] = await Promise.all([
    fetchMetaCampaigns(dateFrom, dateTo),
    fetchMeliCampaigns(dateFrom, dateTo),
  ]);

  const all = [...meta, ...meli];

  // Fetch previous period for comparison
  const { since, until } = getDateRange(dateFrom, dateTo);
  const { prevFrom, prevTo } = getPreviousPeriod(since, until);
  const [prevMeta, prevMeli] = await Promise.all([
    fetchMetaCampaigns(prevFrom, prevTo),
    fetchMeliCampaigns(prevFrom, prevTo),
  ]);
  const prevAll = [...prevMeta, ...prevMeli];

  const current = computeAggregates(all);
  const previous = computeAggregates(prevAll);

  // Compute per-platform aggregates too
  const currentMeta = computeAggregates(meta);
  const prevMetaAgg = computeAggregates(prevMeta);
  const currentMeli = computeAggregates(meli);
  const prevMeliAgg = computeAggregates(prevMeli);

  // Aggregate daily metrics across all campaigns
  // Meta daily data is already fetched with time_increment=1
  // We'll build dailyMetrics from campaign trend data
  // For a proper implementation, we aggregate from raw daily API data
  // For now, we return aggregate dailyMetrics from the campaigns' daily breakdowns
  const dailyMetricsMap: Record<string, { date: string; spent: number; revenue: number; conversions: number; clicks: number; impressions: number }> = {};
  for (const c of all) {
    if (c.dailyBreakdown) {
      for (const d of c.dailyBreakdown) {
        if (!dailyMetricsMap[d.date]) {
          dailyMetricsMap[d.date] = { date: d.date, spent: 0, revenue: 0, conversions: 0, clicks: 0, impressions: 0 };
        }
        dailyMetricsMap[d.date].spent += d.spent || 0;
        dailyMetricsMap[d.date].revenue += d.revenue || 0;
        dailyMetricsMap[d.date].conversions += d.conversions || 0;
        dailyMetricsMap[d.date].clicks += d.clicks || 0;
        dailyMetricsMap[d.date].impressions += d.impressions || 0;
      }
    }
  }
  const dailyMetrics = Object.values(dailyMetricsMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      roas: d.spent > 0 ? d.revenue / d.spent : 0,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      cpc: d.clicks > 0 ? d.spent / d.clicks : 0,
    }));

  return NextResponse.json({
    campaigns: all,
    dailyMetrics,
    comparison: { current, previous },
    comparisonMeta: { current: currentMeta, previous: prevMetaAgg },
    comparisonMeli: { current: currentMeli, previous: prevMeliAgg },
    sources: {
      meta: { count: meta.length, connected: !!process.env.META_ACCESS_TOKEN },
      meli: { count: meli.length, connected: !!process.env.MELI_ACCESS_TOKEN },
    },
    updatedAt: new Date().toISOString(),
  });
}
