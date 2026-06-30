import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ws from 'ws';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  if(line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws }
});

async function check() {
  const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(2);
  console.log(JSON.stringify(data, null, 2));
}
check();
