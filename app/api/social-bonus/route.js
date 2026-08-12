import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await defaultSupabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;

    // Vérifier si le bonus a déjà été réclamé
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('social_bonus_claimed, fidelite_points')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: "Erreur lors de la vérification du profil" }, { status: 500 });
    }

    if (profile.social_bonus_claimed) {
      return NextResponse.json({ error: "Bonus déjà réclamé" }, { status: 400 });
    }

    // Ajouter 1 point et marquer comme réclamé
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        social_bonus_claimed: true,
        fidelite_points: (profile.fidelite_points || 0) + 1
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: "Erreur lors de la mise à jour des points" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Point ajouté avec succès !" });
  } catch (error) {
    console.error("Erreur API Social Bonus:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
