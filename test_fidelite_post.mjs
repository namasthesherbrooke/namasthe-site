import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = '255d6856-0bce-4989-872c-958d381965fa'; // "Test Test" user
  
  // 1. Fetch profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select(`fidelite_points, tickets, prenom, nom, tickets_utilises, date_naissance, birthday_claims (claim_year)`)
    .eq('id', userId)
    .single();
    
  if (fetchError) { console.error("fetchError", fetchError); return; }
  console.log("Current points:", profile.fidelite_points);
  
  // 2. Add point
  const newPoints = (profile.fidelite_points || 0) + 1;
  
  // 3. Update
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ fidelite_points: newPoints })
    .eq('id', userId);
    
  if (updateError) { console.error("updateError", updateError); return; }
  console.log("Successfully updated points to", newPoints);
}
test();
