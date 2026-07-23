import { NextResponse } from 'next/server';
import { supabase as defaultSupabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { sendBirthdayEmail } from '@/lib/brevo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 min max (pour Vercel)

export async function GET(req) {
  try {
    const isManual = req.nextUrl.searchParams.get('manual') === 'true';
    const isTest = req.nextUrl.searchParams.get('test') === 'true';
    const authHeader = req.headers.get('Authorization');
    
    // Sécurité: Si manuel, on vérifie que c'est bien l'admin (token Supabase ou Bearer)
    if (isManual) {
      let isAdmin = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user } } = await defaultSupabase.auth.getUser(token);
        if (user && user.email === 'namasthesherbrooke@gmail.com') {
          isAdmin = true;
        }
      }
      // On peut aussi supporter un secret statique si appelé par Vercel Cron
      if (!isAdmin && req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else {
      // Appel automatique Vercel Cron
      const cronSecret = req.headers.get('Authorization') || req.headers.get('x-cron-secret');
      if (cronSecret !== `Bearer ${process.env.CRON_SECRET}` && cronSecret !== process.env.CRON_SECRET) {
        // En développement local, on permet l'exécution sans secret pour tester
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: "Accès refusé (Cron Secret invalide)" }, { status: 401 });
        }
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : defaultSupabase;

    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    // 1. Récupérer tous les profils avec une date de naissance
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, prenom, nom, email, date_naissance')
      .not('date_naissance', 'is', null)
      .not('email', 'is', null);

    if (profilesError) {
      return NextResponse.json({ error: "Erreur base de données (profils)", details: profilesError }, { status: 500 });
    }

    // 2. Trouver ceux qui fêtent dans 2 jours (ou qui sont en retard)
    const upcomingBirthdays = profiles.filter(p => {
      const birthDate = new Date(p.date_naissance);
      const currentYearBirthDate = new Date(Date.UTC(currentYear, birthDate.getUTCMonth(), birthDate.getUTCDate()));
      currentYearBirthDate.setUTCHours(0,0,0,0);
      
      const diffTime = currentYearBirthDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // On cible "dans 2 jours" ou "hier", bref tout le monde entre -14 jours et +2 jours de leur fête
      // qui n'ont pas encore reçu de email
      return diffDays <= 2 && diffDays >= -14;
    });

    if (upcomingBirthdays.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun anniversaire approchant", processed: 0 });
    }

    // 3. Vérifier qui a déjà reçu le courriel cette année (via la nouvelle table)
    const profileIds = upcomingBirthdays.map(p => p.id);
    const { data: emailsSent, error: emailCheckError } = await supabaseAdmin
      .from('birthday_emails')
      .select('profile_id')
      .in('profile_id', profileIds)
      .eq('year', currentYear);
      
    // Gérer le cas où la table n'existe pas encore
    if (emailCheckError && emailCheckError.code === '42P01') {
      return NextResponse.json({ error: "La table 'birthday_emails' n'existe pas. Veuillez exécuter le code SQL fourni." }, { status: 500 });
    } else if (emailCheckError) {
      return NextResponse.json({ error: "Erreur vérification envois précédents", details: emailCheckError }, { status: 500 });
    }

    const sentIds = new Set(emailsSent ? emailsSent.map(e => e.profile_id) : []);
    
    // Filtrer ceux qui ne l'ont pas encore eu
    const toSend = upcomingBirthdays.filter(p => !sentIds.has(p.id));

    if (toSend.length === 0) {
      return NextResponse.json({ success: true, message: "Tous les courriels ont déjà été envoyés", processed: 0 });
    }

    // Si on est juste en "Test Mode", on n'envoie qu'à l'admin
    if (isTest) {
      const testProfile = toSend[0];
      const result = await sendBirthdayEmail('namasthesherbrooke@gmail.com', testProfile.prenom + ' ' + testProfile.nom);
      return NextResponse.json({ success: true, message: "Email de test envoyé à namasthesherbrooke@gmail.com", profileTested: testProfile });
    }

    // 4. Envoyer les courriels et enregistrer dans la base de données
    let successCount = 0;
    let errors = [];

    for (const profile of toSend) {
      try {
        const result = await sendBirthdayEmail(profile.email, `${profile.prenom || ''} ${profile.nom || ''}`.trim());
        
        if (result.success) {
          // Enregistrer dans la BD pour ne plus l'envoyer cette année
          const { error: insertError } = await supabaseAdmin
            .from('birthday_emails')
            .insert({
              profile_id: profile.id,
              year: currentYear
            });
            
          if (insertError) {
            console.error("Erreur enregistrement log email:", insertError);
            errors.push({ id: profile.id, error: 'Envoyé mais erreur de log BD' });
          } else {
            successCount++;
          }
        } else {
          errors.push({ id: profile.id, error: result.error });
        }
      } catch (e) {
        errors.push({ id: profile.id, error: e.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Envoi terminé: ${successCount} succès`, 
      processed: successCount,
      errors: errors.length > 0 ? errors : undefined 
    });

  } catch (error) {
    console.error("Erreur API Cron Birthdays:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
