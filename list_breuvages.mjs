import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('Breuvage').select('*');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
    data.forEach(d => console.log(d['Nom du produit'] || d.Nom || d.nom));
  }
}
main();
