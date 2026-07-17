import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// --- CONFIGURATION ---
const DRY_RUN = true; // Mettez à false pour envoyer pour de vrai !
const SEND_TO_TEST_ONLY = true; // Mettez à false pour envoyer à TOUT LE MONDE
const TEST_EMAIL = 'votre_courriel@exemple.com'; // Changez pour votre courriel
const TEST_PHONE = '+18190000000'; // Changez pour votre numéro (format international)

// --- CONTENU DU MESSAGE ---
const SMS_CONTENT = "Nouveautés sur le site web Namasthé ! 🍃 Rappel : faites le plein de thés et bubbles teas avant nos vacances. Commandez en ligne : cafenamasthesherbrooke.ca";

const EMAIL_SUBJECT = "Faites le plein avant nos vacances ! 🍃";
const EMAIL_HTML = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #2E7D32;">Nouveautés sur le site web Namasthé ! 🍃</h2>
  <p>Bonjour {{PRENOM}},</p>
  <p>L'été est là ! N'oubliez pas de faire le plein de vos thés et bubbles teas préférés avant notre période de vacances.</p>
  <p>Découvrez nos nouveautés directement sur notre site web et passez votre commande dès maintenant !</p>
  <br/>
  <a href="https://cafenamasthesherbrooke.ca" style="background-color: #388E3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
    Visiter le site web
  </a>
  <br/><br/>
  <p>Merci pour votre fidélité,</p>
  <p><strong>L'équipe du Café Namasthé</strong></p>
</div>
`;

// --- INITIALISATION ---
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

if (!SUPABASE_URL || !SUPABASE_KEY || !BREVO_KEY) {
  console.error("Clés API manquantes dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: ws }
});

// --- FONCTIONS BREVO ---
async function sendBrevoSMS(phone, content) {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '+1' + cleanPhone;
  else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) cleanPhone = '+' + cleanPhone;
  else if (!phone.startsWith('+')) cleanPhone = '+' + cleanPhone;
  else cleanPhone = phone;

  if (DRY_RUN) {
    console.log(`[DRY RUN] 📱 SMS préparé pour ${cleanPhone}: "${content}"`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY
      },
      body: JSON.stringify({
        sender: "Namasthe",
        recipient: cleanPhone,
        content: content,
        type: "marketing"
      })
    });
    
    if (res.ok) {
      console.log(`✅ SMS envoyé à ${cleanPhone}`);
      return true;
    } else {
      const errData = await res.json();
      console.error(`❌ Erreur SMS pour ${cleanPhone}:`, errData);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erreur réseau SMS pour ${cleanPhone}:`, err.message);
    return false;
  }
}

async function sendBrevoEmail(email, prenom, nom) {
  const customizedHtml = EMAIL_HTML.replace('{{PRENOM}}', prenom || 'client(e)');

  if (DRY_RUN) {
    console.log(`[DRY RUN] ✉️ Courriel préparé pour ${email} (${prenom})`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_KEY
      },
      body: JSON.stringify({
        sender: { name: "Café Namasthé", email: "namasthesherbrooke@gmail.com" },
        to: [{ email: email, name: `${prenom} ${nom}`.trim() }],
        subject: EMAIL_SUBJECT,
        htmlContent: customizedHtml
      })
    });
    
    if (res.ok) {
      console.log(`✅ Courriel envoyé à ${email}`);
      return true;
    } else {
      const errData = await res.json();
      console.error(`❌ Erreur Courriel pour ${email}:`, errData);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erreur réseau Courriel pour ${email}:`, err.message);
    return false;
  }
}

// --- SCRIPT PRINCIPAL ---
async function runCampaign() {
  console.log("🚀 Démarrage de la campagne Vacances/Nouveautés...");
  if (DRY_RUN) console.log("⚠️ MODE DRY_RUN ACTIF - Aucun message ne sera réellement envoyé.");
  if (SEND_TO_TEST_ONLY) console.log("⚠️ MODE TEST ACTIF - Envoi uniquement aux contacts de test.");

  console.log("\nRécupération des profils abonnés à l'infolettre...");
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, prenom, nom, email, telephone, preference_contact, newsletter')
    .eq('newsletter', true);

  if (error) {
    console.error("Erreur Supabase:", error);
    process.exit(1);
  }

  console.log(`📊 ${profiles.length} clients abonnés trouvés.`);

  let targets = profiles;

  if (SEND_TO_TEST_ONLY) {
    targets = [
      {
        email: TEST_EMAIL,
        prenom: 'Admin',
        nom: 'Test',
        telephone: TEST_PHONE,
        preference_contact: 'courriel' // Changez à 'texto' pour tester le SMS
      },
      {
        email: 'test_sms@exemple.com',
        prenom: 'Admin',
        nom: 'SMS',
        telephone: TEST_PHONE,
        preference_contact: 'texto'
      }
    ];
    console.log(`🔬 Remplacement par ${targets.length} cibles de test.`);
  }

  let successCount = 0;
  let failCount = 0;

  for (const profile of targets) {
    const pref = (profile.preference_contact || 'courriel').toLowerCase();
    
    if (pref === 'texto' && profile.telephone) {
      // Envoyer SMS
      const success = await sendBrevoSMS(profile.telephone, SMS_CONTENT);
      if (success) successCount++; else failCount++;
    } else {
      // Envoyer Courriel (par défaut ou si texto choisi mais pas de téléphone)
      const success = await sendBrevoEmail(profile.email, profile.prenom, profile.nom);
      if (success) successCount++; else failCount++;
    }
    
    // Pause pour respecter les limites d'API
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n🎉 Campagne terminée !");
  console.log(`Résultats : ${successCount} succès, ${failCount} échecs.`);
  
  if (DRY_RUN || SEND_TO_TEST_ONLY) {
    console.log("\n👉 Pour envoyer la vraie campagne, mettez DRY_RUN et SEND_TO_TEST_ONLY à false dans le script.");
  }
}

runCampaign();
