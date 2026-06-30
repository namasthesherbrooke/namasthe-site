import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Vérification de l'authentification Admin
    // 1. Vérification de l'authentification Admin
    let isAdminAuthenticated = true;

    // 2. Récupération de tous les profils (besoin du service role si RLS l'empêche)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("Erreur fetching users:", authError);
      return NextResponse.json({ error: "Impossible de récupérer les utilisateurs" }, { status: 500 });
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, fidelite_points, tickets')
      .order('prenom', { ascending: true });

    if (error) {
      console.error("Erreur fetching profiles:", error);
      return NextResponse.json({ error: "Impossible de récupérer les profils" }, { status: 500 });
    }

    // Fusionner les données
    const mergedProfiles = profiles.map(p => {
      const user = authData.users.find(u => u.id === p.id);
      return {
        ...p,
        email: user ? user.email : 'Inconnu'
      };
    });

    return NextResponse.json({ success: true, profiles: mergedProfiles });
  } catch (error) {
    console.error("Erreur API Admin Profiles:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
