import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Vérification de l'authentification Admin
    let isAdminAuthenticated = false;
    const authHeader = req.headers.get('Authorization');
    
    // TEMPORARY BYPASS FOR DEBUGGING
    const url = new URL(req.url);
    if (url.searchParams.get('debug') === '1') {
      isAdminAuthenticated = true;
    }
    
    let debugReason = "No token";
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (!token || token === 'undefined' || token === 'null') {
        debugReason = "Token is literally " + token;
      } else {
        const { data: { user }, error: userError } = await defaultSupabase.auth.getUser(token);
        if (userError) {
          debugReason = "User error: " + userError.message;
        } else if (user) {
          if (user.email === 'namasthesherbrooke@gmail.com') {
            isAdminAuthenticated = true;
          } else {
            debugReason = "Email mismatch: " + user.email;
          }
        }
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: "Accès refusé. Debug: " + debugReason }, { status: 403 });
    }

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
      .select('id, prenom, nom, fidelite_points, tickets, tickets_utilises, derniere_visite, telephone:"Telephone", preference_contact, date_naissance')
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
