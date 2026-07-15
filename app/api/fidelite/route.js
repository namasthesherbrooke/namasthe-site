import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { userId, password, action, itemClaimed } = await req.json();

    // 1. Vérification de l'authentification
    let isAdminAuthenticated = false;
    let authDebug = "No token";
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: userError } = await defaultSupabase.auth.getUser(token);
      
      if (userError) {
        authDebug = "getUser error: " + userError.message;
      } else if (user) {
        if (user.email === 'namasthesherbrooke@gmail.com') {
          isAdminAuthenticated = true;
        } else {
          authDebug = "User is not admin: " + user.email;
        }
      }
    }

    if (!isAdminAuthenticated) {
      // Fallback au mot de passe manuel si non connecté
      const adminPassword = process.env.ADMIN_PASSWORD || 'NamastheAdmin!';
      if (password !== adminPassword) {
        return NextResponse.json({ error: "Mot de passe incorrect ou non autorisé. Debug: " + authDebug }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "ID Utilisateur manquant" }, { status: 400 });
    }

    // Créer un client admin pour contourner le RLS (Row Level Security)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Si la clé de service n'est pas configurée, ça va planter avec RLS
    const supabase = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey) 
      : defaultSupabase;

    // 1. Récupérer le profil actuel
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        fidelite_points, 
        tickets, 
        prenom, 
        nom, 
        tickets_utilises, 
        date_naissance,
        birthday_claims (claim_year)
      `)
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error("Fidelite fetch error:", fetchError);
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    let currentPoints = profile.fidelite_points || 0;
    let currentTickets = profile.tickets || 0;
    let currentTicketsUtilises = profile.tickets_utilises || 0;
    let newPoints = currentPoints;
    let newTickets = currentTickets;
    const currentYear = new Date().getFullYear();
    const hasClaimedThisYear = profile.birthday_claims?.some(c => c.claim_year === currentYear);

    // 2. Traiter l'action
    if (action === 'info') {
      return NextResponse.json({ 
        success: true, 
        points: currentPoints, 
        tickets: currentTickets,
        prenom: profile.prenom, 
        nom: profile.nom,
        date_naissance: profile.date_naissance,
        birthdayClaimedThisYear: hasClaimedThisYear,
        derniere_visite: profile.derniere_visite
      });
    } else if (action === 'add') {
      newPoints = currentPoints + 1;
      if (newPoints >= 10) {
        newPoints = newPoints - 10;
        newTickets = currentTickets + 1;
      }
    } else if (action === 'remove') {
      if (currentPoints > 0) {
        newPoints = currentPoints - 1;
      } else {
        return NextResponse.json({ error: "Le client a déjà 0 point." }, { status: 400 });
      }
    } else if (action === 'claim') {
      if (currentTickets > 0) {
        newTickets = currentTickets - 1;
        newTicketsUtilises = currentTicketsUtilises + 1;
      } else if (currentPoints >= 10) {
        newPoints = currentPoints - 10;
        newTicketsUtilises = currentTicketsUtilises + 1;
      } else {
        return NextResponse.json({ error: "Aucun ticket ou point suffisant pour réclamer une récompense." }, { status: 400 });
      }
    } else if (action === 'claim_birthday') {
      
      if (hasClaimedThisYear) {
         return NextResponse.json({ error: "Cadeau déjà réclamé pour cette année." }, { status: 400 });
      }

      const { error: claimError } = await supabase
        .from('birthday_claims')
        .insert({
          profile_id: userId,
          claim_year: currentYear,
          item_claimed: itemClaimed || 'Cadeau non spécifié'
        });

      if (claimError) {
        console.error("Erreur insertion birthday_claims:", claimError);
        return NextResponse.json({ error: "Impossible d'enregistrer le cadeau" }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        points: currentPoints, 
        tickets: currentTickets,
        prenom: profile.prenom, 
        nom: profile.nom,
        date_naissance: profile.date_naissance,
        birthdayClaimedThisYear: true
      });
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const updatePayload = { 
      fidelite_points: newPoints, 
      tickets: newTickets,
      tickets_utilises: newTicketsUtilises
    };

    if (action === 'add' || action === 'claim') {
      updatePayload.derniere_visite = new Date().toISOString();
    }

    // 3. Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      points: newPoints, 
      tickets: newTickets,
      prenom: profile.prenom, 
      nom: profile.nom,
      date_naissance: profile.date_naissance,
      birthdayClaimedThisYear: hasClaimedThisYear,
      derniere_visite: updatePayload.derniere_visite || profile.derniere_visite
    });

  } catch (error) {
    console.error("Erreur API Fidelite:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
