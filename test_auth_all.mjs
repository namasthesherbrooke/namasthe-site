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
  const usersWithToken = authData.users?.filter(u => u.user_metadata?.push_token);
  console.log("Users with push_token:", usersWithToken?.map(u => ({ email: u.email, push_token: u.user_metadata.push_token })));
}
test();
