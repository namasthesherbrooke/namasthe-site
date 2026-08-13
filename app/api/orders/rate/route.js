import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { orderId, ratingService, ratingItems, feedback } = await req.json();

    if (!orderId || !ratingService || !ratingItems) {
      return NextResponse.json({ error: 'orderId et les notes sont requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ rating_service: ratingService, rating_items: ratingItems, feedback: feedback || null })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[RATE ORDER ERROR]', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('[RATE ORDER EXCEPTION]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
