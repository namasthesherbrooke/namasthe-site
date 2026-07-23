import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max

export async function GET(req) {
  try {
    const authHeader = req.headers.get('Authorization');
    let isAdmin = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await defaultSupabase.auth.getUser(token);
      if (user && user.email === 'namasthesherbrooke@gmail.com') {
        isAdmin = true;
      }
    }

    if (!isAdmin && req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;
    const brevoApiKey = process.env.BREVO_API_KEY;

    if (!brevoApiKey) {
      return NextResponse.json({ error: "Clé API Brevo manquante" }, { status: 500 });
    }

    // 1. Récupérer TOUS les profils
    const { data: dbProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, date_naissance, "Telephone", preference_contact');

    if (profilesError) {
      return NextResponse.json({ error: "Erreur BD", details: profilesError }, { status: 500 });
    }

    // 1.5. Récupérer les courriels (qui sont dans auth.users, pas dans profiles)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = {};
    if (!authError && authData?.users) {
      authData.users.forEach(u => {
        if (u.email) emailMap[u.id] = u.email;
      });
    }

    const profiles = dbProfiles
      .map(p => ({ ...p, email: emailMap[p.id] }))
      .filter(p => p.email && p.email.trim() !== '');

    let successCount = 0;
    let errors = [];

    // 2. Préparer les requêtes vers Brevo (on le fait séquentiellement pour éviter les limites de rate)
    for (const profile of profiles) {
      const cleanPhone = profile.Telephone ? profile.Telephone.replace(/\D/g, '') : null;
      let formattedPhone = null;
      
      if (cleanPhone) {
        if (cleanPhone.length === 10) formattedPhone = '+1' + cleanPhone;
        else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) formattedPhone = '+' + cleanPhone;
        else if (profile.Telephone.startsWith('+')) formattedPhone = profile.Telephone;
        else formattedPhone = '+' + cleanPhone;
      }

      const payload = {
        email: profile.email,
        updateEnabled: true,
        listIds: [2], // ID de votre liste par défaut
        attributes: {
          PRENOM: profile.prenom || "",
          NOM: profile.nom || ""
        }
      };

      if (profile.date_naissance) {
        payload.attributes.DATE_NAISSANCE = profile.date_naissance;
      }
      
      if (formattedPhone) {
        payload.attributes.SMS = formattedPhone;
        payload.attributes.TELEPHONE = formattedPhone;
      }
      
      if (profile.preference_contact) {
        payload.attributes.PREF_CONTACT = profile.preference_contact.toUpperCase();
      }

      try {
        const response = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': brevoApiKey
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successCount++;
        } else {
          const data = await response.json();
          errors.push({ email: profile.email, error: data });
        }
      } catch (err) {
        errors.push({ email: profile.email, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synchronisation terminée ! ${successCount} contacts mis à jour dans Brevo.`, 
      total: profiles.length,
      successCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Erreur API Sync Brevo:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
