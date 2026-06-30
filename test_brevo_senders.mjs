import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const brevoKeyMatch = envFile.match(/BREVO_API_KEY=(.+)/);
const brevoKey = brevoKeyMatch ? brevoKeyMatch[1].trim() : null;

async function test() {
  const res = await fetch('https://api.brevo.com/v3/senders', {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'api-key': brevoKey }
  });
  const data = await res.json();
  console.log("Senders:", JSON.stringify(data, null, 2));
}
test();
