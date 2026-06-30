import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

async function testSupabase() {
    console.log("--- Testing Supabase ---");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) console.error("Supabase Error:", error.message);
    else console.log("Supabase Connection: OK (Profiles fetched successfully)");
}

async function testClover() {
    console.log("--- Testing Clover ---");
    const merchantId = process.env.CLOVER_MERCHANT_ID || '30009190018'; // From .env.local
    const cloverApiToken = process.env.CLOVER_INVENTORY_TOKEN;
    if (!cloverApiToken) {
        console.error("Clover Error: Missing CLOVER_INVENTORY_TOKEN");
        return;
    }
    try {
        const response = await fetch(`https://api.clover.com/v3/merchants/${merchantId}/items?limit=1`, {
            headers: {
                'Authorization': `Bearer ${cloverApiToken}`,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log("Clover Connection: OK (Inventory fetched successfully)");
    } catch (e) {
        console.error("Clover Error:", e.message);
    }
}

async function testBrevo() {
    console.log("--- Testing Brevo ---");
    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) {
        console.error("Brevo Error: Missing BREVO_API_KEY");
        return;
    }
    try {
        const response = await fetch('https://api.brevo.com/v3/account', {
            headers: {
                'api-key': brevoKey,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log("Brevo Connection: OK (Account email: " + data.email + ")");
    } catch (e) {
        console.error("Brevo Error:", e.message);
    }
}

async function runTests() {
    await testSupabase();
    await testClover();
    await testBrevo();
}

runTests();
