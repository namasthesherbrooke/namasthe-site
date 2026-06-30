import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws }
});

async function check() {
  const { data } = await supabase.from('square_cache').select('catalog_data').order('id', { ascending: false }).limit(1);
  const mls = data[0].catalog_data.modifierLists;
  
  mls.forEach(ml => {
    ml.modifiers.forEach(mod => {
      if (mod.name.toLowerCase().includes('coco')) {
        console.log(`${mod.name}: ${mod.price}`);
      }
    });
  });
}
check();
