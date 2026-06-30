import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('creations').select('*').ilike('nom_breuvage', '%limonade%');
  console.log(JSON.stringify(data, null, 2));
}
check();
