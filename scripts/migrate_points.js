const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('/run/media/namasth/Coeur du site/Antigravity/Namasthé/site/.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
});

if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migratePoints() {
  console.log("Démarrage de la migration des points existants...");
  
  // Récupérer tous les profils qui ont plus de 9 points
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, fidelite_points, tickets')
    .gte('fidelite_points', 10);
    
  if (error) {
    console.error("Erreur de récupération:", error);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log("Aucun profil n'a besoin de migration. Tous ont moins de 10 points.");
    return;
  }
  
  console.log(`${profiles.length} profil(s) trouvé(s) avec 10 points ou plus.`);
  
  for (const profile of profiles) {
    const points = profile.fidelite_points || 0;
    const currentTickets = profile.tickets || 0;
    
    const extraTickets = Math.floor(points / 10);
    const newPoints = points % 10;
    const newTickets = currentTickets + extraTickets;
    
    console.log(`Profil ${profile.id}: ${points} pts -> ${newPoints} pts & ${newTickets} tickets`);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        fidelite_points: newPoints,
        tickets: newTickets
      })
      .eq('id', profile.id);
      
    if (updateError) {
      console.error(`Erreur mise à jour profil ${profile.id}:`, updateError);
    }
  }
  
  console.log("Migration terminée !");
}

migratePoints();
