import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          custom_instructions,
          quantity,
          item_total_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, orders: data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    
    if (!body.id || !body.status) {
      return NextResponse.json({ error: "L'ID et le statut sont requis." }, { status: 400 });
    }

    const updateData = { status: body.status };
    if (body.status === 'preparing') updateData.preparing_at = new Date().toISOString();
    else if (body.status === 'ready') updateData.ready_at = new Date().toISOString();
    else if (body.status === 'completed') updateData.completed_at = new Date().toISOString();

    let { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    // Fallback au cas où les colonnes n'ont pas encore été créées dans Supabase
    if (error && error.code === '42703') {
      const fallback = await supabaseAdmin
        .from('orders')
        .update({ status: body.status })
        .eq('id', body.id)
        .select()
        .single();
      
      data = fallback.data;
      if (fallback.error) throw fallback.error;
    } else if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error("Erreur PUT /api/admin/orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
