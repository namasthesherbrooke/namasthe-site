import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const adminEmail = searchParams.get('adminEmail');

  // Vérification basique que c'est l'admin
  if (adminEmail !== 'namasthesherbrooke@gmail.com') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          custom_instructions,
          quantity,
          item_total_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, orders: data || [] });
  } catch (error) {
    console.error('Erreur historique ventes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
