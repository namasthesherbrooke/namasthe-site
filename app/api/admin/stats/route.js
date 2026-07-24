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

    // Récupérer tous les profils (pas idéal pour 10M utilisateurs, mais ok pour une petite boutique)
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, created_at, date_naissance, code_postal');

    if (error) {
      throw error;
    }

    // Récupérer l'historique des visites (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: visitsLog, error: visitsError } = await supabaseAdmin
      .from('visits_log')
      .select('id, profile_id, visited_at, profiles(prenom, nom)')
      .gte('visited_at', thirtyDaysAgo.toISOString())
      .order('visited_at', { ascending: false });

    // 1. Inscriptions par mois (6 derniers mois)
    const monthlyRegistrations = {};
    const monthsNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    
    profiles.forEach(p => {
      if (p.created_at) {
        const d = new Date(p.created_at);
        const key = `${monthsNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyRegistrations[key] = (monthlyRegistrations[key] || 0) + 1;
      }
    });

    // Reformater pour Recharts
    const registrationsData = Object.keys(monthlyRegistrations).map(k => ({
      name: k,
      inscriptions: monthlyRegistrations[k]
    }));
    // Note: un vrai tri temporel serait mieux, mais pour la simplicité on se fie à l'ordre d'insertion

    // 2. Pyramide des âges
    let ageGroups = {
      "Moins de 18": 0,
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-54": 0,
      "55+": 0,
      "Inconnu": 0
    };

    const currentYear = new Date().getFullYear();
    profiles.forEach(p => {
      if (p.date_naissance) {
        const birthYear = parseInt(p.date_naissance.split('-')[0], 10);
        if (!isNaN(birthYear)) {
          const age = currentYear - birthYear;
          if (age < 18) ageGroups["Moins de 18"]++;
          else if (age <= 24) ageGroups["18-24"]++;
          else if (age <= 34) ageGroups["25-34"]++;
          else if (age <= 44) ageGroups["35-44"]++;
          else if (age <= 54) ageGroups["45-54"]++;
          else ageGroups["55+"]++;
        } else {
          ageGroups["Inconnu"]++;
        }
      } else {
        ageGroups["Inconnu"]++;
      }
    });

    const ageData = Object.keys(ageGroups)
      .filter(k => ageGroups[k] > 0 || k !== "Inconnu") // Garder inconnu seulement s'il y en a (souvent tous l'ont)
      .map(k => ({
        name: k,
        valeur: ageGroups[k]
      }));

    // 3. Codes Postaux (Régions)
    const postalCodes = {};
    profiles.forEach(p => {
      if (p.code_postal && p.code_postal.length >= 3) {
        // Prendre les 3 premiers caractères (Région de tri d'acheminement)
        let fsa = p.code_postal.substring(0, 3).toUpperCase();
        // Optionnel: traduire certains FSA connus à Sherbrooke
        const knownFSA = {
          "J1H": "Centre-ville/Sud",
          "J1J": "Nord",
          "J1K": "Université",
          "J1L": "Plateau",
          "J1M": "Lennoxville",
          "J1N": "Rock Forest",
          "J1R": "St-Élie",
          "J1C": "Bromptonville",
          "J1E": "Est",
          "J1G": "Fleurimont"
        };
        const label = knownFSA[fsa] ? `${fsa} (${knownFSA[fsa]})` : fsa;
        postalCodes[label] = (postalCodes[label] || 0) + 1;
      } else {
        postalCodes["Inconnu"] = (postalCodes["Inconnu"] || 0) + 1;
      }
    });

    const postalData = Object.keys(postalCodes)
      .map(k => ({
        name: k,
        clients: postalCodes[k]
      }))
      .sort((a, b) => b.clients - a.clients) // Trier par popularité
      .slice(0, 10); // Garder le top 10

    // 4. Visites des 14 derniers jours
    const visitsPerDay = {};
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    // Initialiser les 14 derniers jours à 0 pour éviter des trous dans le graphique
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      visitsPerDay[dayStr] = 0;
    }

    let recentVisitsList = [];
    if (visitsLog) {
      visitsLog.forEach(v => {
        const d = new Date(v.visited_at);
        if (d >= fourteenDaysAgo) {
          const dayStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          if (visitsPerDay[dayStr] !== undefined) {
            visitsPerDay[dayStr]++;
          }
        }
      });
      
      recentVisitsList = visitsLog.slice(0, 15).map(v => ({
        id: v.id,
        nom: v.profiles ? `${v.profiles.prenom} ${v.profiles.nom}` : "Client inconnu",
        date: new Date(v.visited_at).toLocaleString('fr-CA', { 
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        })
      }));
    }

    const visitsTrendData = Object.keys(visitsPerDay).map(k => ({
      name: k,
      visites: visitsPerDay[k]
    }));

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalProfiles: profiles.length,
        registrationsData,
        ageData,
        postalData,
        visitsTrendData,
        recentVisitsList
      }
    });
  } catch (error) {
    console.error("Erreur API Stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
