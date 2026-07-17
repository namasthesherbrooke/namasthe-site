import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

let envFile;
try {
  envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/['"]/g, '').trim();
    }
  });
} catch (e) {
  console.error("Erreur de lecture du fichier .env.local", e.message);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = process.env.BREVO_LIST_ID ? parseInt(process.env.BREVO_LIST_ID) : 2; 

if (!SUPABASE_URL || !SUPABASE_KEY || !BREVO_KEY) {
  console.error("Clés API manquantes dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: ws }
});

// --- FONCTION DE SYNCHRONISATION ---
async function syncProfileToBrevo(profile) {
  const { email, prenom, nom, date_naissance, telephone, preference_contact } = profile;
  
  if (!email) return false;

  let payload = {
    email: email,
    updateEnabled: true, // Si le contact existe déjà (les 28 actuels), il sera simplement mis à jour !
    listIds: [BREVO_LIST_ID],
    attributes: {
      PRENOM: prenom || "",
      NOM: nom || ""
    }
  };

  if (date_naissance) {
    payload.attributes.DATE_NAISSANCE = date_naissance;
  }
  
  if (telephone) {
    let cleanPhone = telephone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '+1' + cleanPhone;
    else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) cleanPhone = '+' + cleanPhone;
    else if (!telephone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    else cleanPhone = telephone;
    
    payload.attributes.SMS = cleanPhone;
    payload.attributes.TELEPHONE = cleanPhone;
  }
  
  if (preference_contact) {
    payload.attributes.PREF_CONTACT = preference_contact.toUpperCase();
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY
      },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      console.log(`✅ Succès : ${email}`);
      return true;
    } else {
      const err = await res.text();
      console.error(`❌ Erreur pour ${email} (Status ${res.status}):`, err);
      return false;
    }
  } catch (e) {
    console.error(`❌ Erreur réseau pour ${email}:`, e.message);
    return false;
  }
}

// --- SCRIPT PRINCIPAL ---
async function runSync() {
  console.log("🚀 Démarrage de la synchronisation Supabase -> Brevo...");
  
  // On récupère uniquement ceux qui veulent l'infolettre / cadeau d'anniversaire
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Erreur de récupération Auth :", authError);
    process.exit(1);
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, telephone:"Telephone"')
    .eq('newsletter', true);

  if (error) {
    console.error("Erreur de récupération Supabase :", error);
    process.exit(1);
  }

  // Fusion
  const mergedProfiles = profiles.map(p => {
    const user = authData.users.find(u => u.id === p.id);
    return { ...p, email: user ? user.email : null };
  }).filter(p => p.email);

  console.log(`📊 ${mergedProfiles.length} profils complets trouvés (abonnés à l'infolettre).`);
  console.log("Envoi à Brevo (cela peut prendre quelques instants)...\n");

  let successCount = 0;
  let failCount = 0;

  for (const profile of mergedProfiles) {
    const success = await syncProfileToBrevo(profile);
    if (success) successCount++;
    else failCount++;
    
    // Pause pour respecter la limite d'API Brevo (10 requêtes / seconde)
    await new Promise(resolve => setTimeout(resolve, 200)); 
  }

  console.log("\n🎉 Synchronisation terminée !");
  console.log(`Résultats : ${successCount} ajouts/mises à jour, ${failCount} échecs.`);
  console.log("Connectez-vous à Brevo, vous devriez maintenant voir tous vos contacts !");
}

runSync();
