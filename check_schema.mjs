import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Fix __dirname in ES modules or just use relative paths
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].replace(/['"]/g, '').trim();
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    global: { fetch: fetch.bind(globalThis) }
  }
);

async function check() {
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
    
  console.log("Orders schema sample:", ordersData ? Object.keys(ordersData[0] || {}) : ordersError);
  console.log("Orders data sample:", ordersData ? ordersData[0] : ordersError);
  
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);
    
  console.log("Order items schema sample:", itemsData ? Object.keys(itemsData[0] || {}) : itemsError);
}

check();
