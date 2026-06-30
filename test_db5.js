const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) { envVars[match[1]] = match[2].replace(/^"(.*)"$/, '$1'); }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/';
const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

fetch(url, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } })
  .then(res => res.json())
  .then(data => {
    const tables = Object.keys(data.paths).filter(p => p !== '/').map(p => p.substring(1));
    console.log("Tables:", tables.join(', '));
  })
  .catch(console.error);

