import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: stats, error } = await supabase
      .from('site_stats')
      .select('total_views')
      .eq('id', 1)
      .single();

    if (error) {
      console.error("Erreur lecture site_stats:", error);
      return NextResponse.json({ error: 'Impossible de lire les statistiques' }, { status: 500 });
    }

    return NextResponse.json({ success: true, total_views: stats?.total_views || 0 });
  } catch (error) {
    console.error("API Stats GET error:", error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
