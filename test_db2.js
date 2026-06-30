const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { envVars[match[1]] = match[2].replace(/^"(.*)"$/, '$1'); }
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function test() {
  const { data, error } = await supabase.from('Recettes').select('*').limit(1);
  if (error) console.error("Recettes:", error.message);
  else console.log("Recettes:", data);

  const { data: d2, error: e2 } = await supabase.from('recettes').select('*').limit(1);
  if (e2) console.error("recettes:", e2.message);
  else console.log("recettes:", d2);
}
test();
