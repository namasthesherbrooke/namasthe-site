import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkVariations() {
  const { data, error } = await supabase.from('square_cache').select('catalog_data').limit(1);
  if (error) { console.error(error); return; }
  
  const items = data[0].catalog_data.items;
  const itemsWithMultipleVariations = items.filter(i => i.variations && i.variations.length > 1);
  console.log('Total items:', items.length);
  console.log('Items with multiple variations:', itemsWithMultipleVariations.length);
  if (itemsWithMultipleVariations.length > 0) {
    console.log('Example:', itemsWithMultipleVariations[0].name, itemsWithMultipleVariations[0].variations);
  }
}

checkVariations();
