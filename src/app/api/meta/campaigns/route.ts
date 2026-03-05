import { NextResponse } from 'next/server';

const BASE = 'https://graph.facebook.com/v19.0';

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json({ error: 'Meta credentials not configured', configured: { token: !!token, adAccountId: !!adAccountId } }, { status: 400 });
  }

  try {
    // 1. Get campaigns
    const campaignsRes = await fetch(
      `${BASE}/${adAccountId}/campaigns?fields=name,status,daily_budget,lifetime_budget,objective&access_token=${token}&limit=50`,
      { cache: 'no-store' }
    );
    const campaignsData = await campaignsRes.json();

    if (campaignsData.error) {
      return NextResponse.json({ error: 'Meta API error', details: campaignsData.error }, { status: 400 });
    }

    // 2. Get insights at campaign level (last 7 days)
    const insightsRes = await fetch(
      `${BASE}/${adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,cost_per_action_type&date_preset=last_7d&level=campaign&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    );
    const insightsData = await insightsRes.json();

    // 3. Get daily breakdown for trends
    const dailyRes = await fetch(
      `${BASE}/${adAccountId}/insights?fields=campaign_id,spend,actions,action_values&date_preset=last_7d&level=campaign&time_increment=1&limit=200&access_token=${token}`,
      { cache: 'no-store' }
    );
    const dailyData = await dailyRes.json();

    // 4. Get adset-level insights
    const adsetRes = await fetch(
      `${BASE}/${adAccountId}/insights?fields=adset_id,adset_name,campaign_id,spend,clicks,ctr,actions,action_values&date_preset=last_7d&level=adset&limit=100&access_token=${token}`,
      { cache: 'no-store' }
    );
    const adsetData = await adsetRes.json();

    // Process and combine
    const campaigns = (campaignsData.data || []).map((camp: any) => {
      const insight = (insightsData.data || []).find((i: any) => i.campaign_id === camp.id);
      const dailyInsights = (dailyData.data || []).filter((d: any) => d.campaign_id === camp.id);
      const adsets = (adsetData.data || []).filter((a: any) => a.campaign_id === camp.id);

      if (!insight) return null;

      const spend = parseFloat(insight.spend || '0');
      const impressions = parseInt(insight.impressions || '0');
      const reach = parseInt(insight.reach || '0');
      const clicks = parseInt(insight.clicks || '0');
      const ctr = parseFloat(insight.ctr || '0');
      const cpc = parseFloat(insight.cpc || '0');
      const cpm = parseFloat(insight.cpm || '0');
      const frequency = parseFloat(insight.frequency || '0');

      // Extract purchase conversions and revenue
      const purchaseAction = (insight.actions || []).find((a: any) =>
        a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      );
      const purchaseValue = (insight.action_values || []).find((a: any) =>
        a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      );

      const conversions = parseInt(purchaseAction?.value || '0');
      const revenue = parseFloat(purchaseValue?.value || '0');
      const roas = spend > 0 ? revenue / spend : 0;
      const costPerResult = conversions > 0 ? spend / conversions : 0;

      // Build daily ROAS trend
      const trend = dailyInsights.map((d: any) => {
        const dSpend = parseFloat(d.spend || '0');
        const dRevVal = (d.action_values || []).find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const dRev = parseFloat(dRevVal?.value || '0');
        return dSpend > 0 ? dRev / dSpend : 0;
      });

      // Build adset data
      const processedAdsets = adsets.map((as: any) => {
        const asSpend = parseFloat(as.spend || '0');
        const asPurchase = (as.actions || []).find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        const asRevVal = (as.action_values || []).find((a: any) =>
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
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
        platform: 'meta' as const,
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
        trend,
        trendLabels: dailyInsights.map((d: any) => d.date_start?.slice(5) || ''),
        adSets: processedAdsets,
      };
    }).filter(Boolean);

    return NextResponse.json({ campaigns, raw: { campaignsCount: campaignsData.data?.length, insightsCount: insightsData.data?.length } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch Meta data', details: String(err) }, { status: 500 });
  }
}
