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

    // 1. Récupérer tous les profils qui ont une date de naissance
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, date_naissance')
      .not('date_naissance', 'is', null);

    if (profilesError) {
      console.error("Erreur fetching profiles:", profilesError);
      return NextResponse.json({ error: "Impossible de récupérer les profils" }, { status: 500 });
    }

    // 2. Filtrer pour garder seulement ceux du mois en cours
    const currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan, 6 = Jul)
    const currentYear = new Date().getFullYear();

    const birthdaysThisMonth = profiles.filter(p => {
      if (!p.date_naissance) return false;
      const birthDate = new Date(p.date_naissance);
      // Gérer les timezone pour ne pas décaler le mois
      const birthMonth = birthDate.getUTCMonth(); 
      return birthMonth === currentMonth;
    });

    // S'il n'y a personne, on retourne un tableau vide
    if (birthdaysThisMonth.length === 0) {
      return NextResponse.json({ success: true, birthdays: [] });
    }

    const profileIds = birthdaysThisMonth.map(p => p.id);

    // 3. Récupérer les réclamations de l'année en cours pour ces profils
    const { data: claims, error: claimsError } = await supabaseAdmin
      .from('birthday_claims')
      .select('*')
      .in('user_id', profileIds)
      .eq('claim_year', currentYear);

    if (claimsError) {
      console.error("Erreur fetching claims:", claimsError);
      // On retourne quand même les fêtés, mais avec le statut non réclamé par défaut
    }

    const claimsMap = {};
    if (claims) {
      claims.forEach(c => {
        claimsMap[c.user_id] = c;
      });
    }

    // 4. Assembler les données
    const result = birthdaysThisMonth.map(p => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      date_naissance: p.date_naissance,
      isClaimed: !!claimsMap[p.id],
      claimDetails: claimsMap[p.id] || null
    }));

    // Trier par nom
    result.sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));

    return NextResponse.json({ success: true, birthdays: result });
  } catch (error) {
    console.error("Erreur API Admin Birthdays (Month):", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
