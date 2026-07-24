import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    let isAdminAuthenticated = false;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await defaultSupabase.auth.getUser(token);
      if (user && user.email === 'namasthesherbrooke@gmail.com') {
        isAdminAuthenticated = true;
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;

    const { data: claims, error } = await supabaseAdmin
      .from('birthday_claims')
      .select(`
        id,
        claimed_at,
        item_claimed,
        claim_year,
        profiles (
          prenom,
          nom
        )
      `)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error("Erreur fetching claims:", error);
      return NextResponse.json({ error: "Impossible de récupérer les cadeaux" }, { status: 500 });
    }

    return NextResponse.json({ success: true, claims });
  } catch (error) {
    console.error("Erreur API Admin Birthday:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    let isAdminAuthenticated = false;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await defaultSupabase.auth.getUser(token);
      if (user && user.email === 'namasthesherbrooke@gmail.com') {
        isAdminAuthenticated = true;
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { profileId, itemClaimed } = await req.json();
    if (!profileId || !itemClaimed) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;

    const currentYear = new Date().getFullYear();

    const { data, error } = await supabaseAdmin
      .from('birthday_claims')
      .insert([{ profile_id: profileId, item_claimed: itemClaimed, claim_year: currentYear }]);

    if (error) {
      console.error("Erreur insertion:", error);
      return NextResponse.json({ error: "Impossible d'enregistrer le cadeau" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API POST Birthday:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
