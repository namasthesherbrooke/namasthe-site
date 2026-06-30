import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders:', error ? error.message : 'OK');
  const { data: d2, error: e2 } = await supabase.from('order_items').select('*').limit(1);
  console.log('Order Items:', e2 ? e2.message : 'OK');
}
run();
