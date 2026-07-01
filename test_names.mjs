import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('square_cache').select('catalog_data').order('id', { ascending: false }).limit(1);
  if (data && data.length > 0) {
    const items = data[0].catalog_data.items;
    items.forEach(i => {
      if (i.name.toLowerCase().includes('simplicit') || i.name.toLowerCase().includes('mega') || i.name.toLowerCase().includes('lotus')) {
        console.log(`ID: ${i.id}, Name: "${i.name}", Variations: ${i.variations?.length}`);
      }
    });
  }
}
run();
