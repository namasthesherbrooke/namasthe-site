import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpbavzawkozlcsnszlpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYmF2emF3a296bGNzbnN6bHByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTg4MSwiZXhwIjoyMDk1MDQ3ODgxfQ.OFuNsYSiNFyYQLew4ZkhnqnTBFxc-i6JnaZcluIiOAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  console.log("Users count:", users?.length, authError);
  
  const { data: all, error: errAll } = await supabase.from('profiles').select('id, prenom, nom, fidelite_points');
  console.log("Profiles count:", all?.length, errAll);
}
check();
