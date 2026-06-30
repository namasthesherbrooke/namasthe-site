import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supaUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const supaKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

async function test() {
  const res = await fetch(`${supaUrl}/rest/v1/profiles?role=eq.barista&select=id,push_token&limit=1`, {
    headers: {
      'apikey': supaKey,
      'Authorization': `Bearer ${supaKey}`
    }
  });
  const data = await res.json();
  const baristaUser = data[0];

  console.log("Barista Profile:", baristaUser);

  if (baristaUser && baristaUser.push_token) {
    const pushToken = baristaUser.push_token;
    console.log("Sending push to:", pushToken);
    
    const resPush = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: 'Test Notification',
        body: 'Ceci est un test de notification Push',
        data: { someData: 'goes here' },
      }),
    });
    const receipt = await resPush.json();
    console.log("Expo response:", JSON.stringify(receipt, null, 2));
  }
}
test();
