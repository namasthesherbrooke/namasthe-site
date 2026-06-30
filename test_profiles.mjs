import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
async function test() {
  const { data, error } = await supabaseAdmin.from('profiles').select('id, prenom, nom, fidelite_points, tickets').order('prenom', { ascending: true });
  console.log('Error:', error);
  console.log('Data count:', data?.length);
}
test();
