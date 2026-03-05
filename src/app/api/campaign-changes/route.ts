import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    let query = supabase
      .from('campaign_changes')
      .select('*')
      .order('changed_at', { ascending: true });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (dateFrom) {
      query = query.gte('changed_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('changed_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ changes: data || [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaign_id, campaign_name, platform, change_type, before_value, after_value, note, changed_at } = body;

    if (!campaign_id || !campaign_name || !platform || !change_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaign_changes')
      .insert({
        campaign_id,
        campaign_name,
        platform,
        change_type,
        before_value,
        after_value,
        note,
        changed_at: changed_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ change: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}