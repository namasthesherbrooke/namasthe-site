import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('Breuvage')
    .delete()
    .eq('Nom du produit', 'Namas-Tails')
    .eq('Description du produit', 'Nos cocktails sans alcool inspirés des grands classiques. Élégants, rafraîchissants et festifs.');
    
  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted the duplicate.');
  }
}
main();
