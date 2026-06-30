import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const envFile = readFileSync('.env.local', 'utf8');
let env = {};
envFile.split('\n').forEach(line => {
  if(line.includes('=')) {
    let [key, val] = line.split('=');
    env[key] = val.trim();
  }
});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, fidelite_points, tickets');
  if(error) { console.error(error); return; }
  
  let count = 0;
  for (let p of profiles) {
    if (p.fidelite_points >= 10) {
      const extraTickets = Math.floor(p.fidelite_points / 10);
      const remainingPoints = p.fidelite_points % 10;
      const newTickets = (p.tickets || 0) + extraTickets;
      
      await supabase.from('profiles').update({
        fidelite_points: remainingPoints,
        tickets: newTickets
      }).eq('id', p.id);
      count++;
      console.log(`Updated ${p.id}: ${p.fidelite_points} points -> ${remainingPoints} points, ${newTickets} tickets`);
    }
  }
  console.log(`Fixed ${count} profiles`);
}
fix();
