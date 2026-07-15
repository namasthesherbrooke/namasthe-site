import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Récupérer la valeur actuelle
    const { data: stats, error: fetchError } = await supabase
      .from('site_stats')
      .select('total_views')
      .eq('id', 1)
      .single();

    if (fetchError) {
      console.error("Erreur lecture site_stats:", fetchError);
      return NextResponse.json({ error: 'Impossible de lire les statistiques' }, { status: 500 });
    }

    // 2. Incrémenter la valeur
    const newTotal = (stats?.total_views || 0) + 1;

    const { error: updateError } = await supabase
      .from('site_stats')
      .update({ total_views: newTotal })
      .eq('id', 1);

    if (updateError) {
      console.error("Erreur maj site_stats:", updateError);
      return NextResponse.json({ error: 'Impossible de mettre à jour les statistiques' }, { status: 500 });
    }

    return NextResponse.json({ success: true, total_views: newTotal });
  } catch (error) {
    console.error("API Visit error:", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
