import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('numero');
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  if (!orderNumber) {
    return NextResponse.json({ error: 'Numéro de commande manquant' }, { status: 400 });
  }

  try {
    let query = supabase.from('orders').select(`*, order_items(*)`).eq('order_number', orderNumber);

    // Si pas de userId fourni (invité), on vérifie l'email pour plus de sécurité
    if (!userId && email) {
      query = query.eq('customer_email', email);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      return NextResponse.json({ error: 'Authentification requise (email ou compte)' }, { status: 400 });
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
