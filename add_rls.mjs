import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const SUPABASE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: `
    CREATE POLICY "Admin can view all orders" ON public.orders FOR SELECT USING (
      auth.jwt() ->> 'email' = 'namasthesherbrooke@gmail.com'
    );
  `});
  console.log('Result:', error || 'Success');
}
run();
