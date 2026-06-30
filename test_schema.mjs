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

async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
run();
