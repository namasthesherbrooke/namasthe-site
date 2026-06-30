import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId manquant' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, orders: data || [] });
  } catch (error) {
    console.error('Erreur chargement historique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
