import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws }
});

async function check() {
  const { data } = await supabase.from('square_cache').select('catalog_data').order('id', { ascending: false }).limit(1);
  const items = data[0].catalog_data.items;
  
  const search = ['simplicithé', 'méga', 'lotus', 'mindblow', 'limonade', 'bubble', 'rafraichi', 'fruithé', 'latté', 'smoothie'];
  items.forEach(i => {
    const name = i.name.toLowerCase();
    if (search.some(s => name.includes(s))) {
      console.log(`${i.name}: ${i.variations.map(v => v.name + '=' + v.price).join(', ')}`);
    }
  });
}
check();
