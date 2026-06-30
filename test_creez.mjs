import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('square_cache').select('catalog_data').order('id', { ascending: false }).limit(1);
  const items = data[0].catalog_data.items;
  const creez = items.find(i => i.name.toLowerCase().includes('créez le de toute pièce') || i.name.toLowerCase().includes('creez'));
  console.log(JSON.stringify(creez, null, 2));
}
check();
