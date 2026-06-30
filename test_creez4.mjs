import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws }
});

async function check() {
  const { data } = await supabase.from('square_cache').select('catalog_data').order('id', { ascending: false }).limit(1);
  const ml = data[0].catalog_data.modifierLists;
  const lists = ml.filter(m => ["KPFXBZQDZ3F3YBAEXERLSH7C", "CLPKFDR4AVE6YEREROJPLMC7", "V5USDXHX2BSMRGD7FYQWZRZT"].includes(m.id));
  console.log(JSON.stringify(lists, null, 2));
}
check();
