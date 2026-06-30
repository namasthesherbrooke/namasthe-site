import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supaUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const supaKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

async function test() {
  const authRes = await fetch(`${supaUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`
    }
  });
  const authData = await authRes.json();
  const adminUser = authData.users?.find(u => u.email === 'namasthesherbrooke@gmail.com');
  console.log("Admin user metadata:", adminUser?.user_metadata);
}
test();
