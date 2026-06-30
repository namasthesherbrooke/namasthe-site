import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const brevoKeyMatch = envFile.match(/BREVO_API_KEY=(.+)/);
const brevoKey = brevoKeyMatch ? brevoKeyMatch[1].trim() : null;

async function test() {
  const res = await fetch('https://api.brevo.com/v3/smtp/statistics/events?limit=20&sort=desc', {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'api-key': brevoKey }
  });
  const data = await res.json();
  data.events?.forEach(e => {
    console.log(`- [${e.date}] To: ${e.email} | Subj: ${e.subject} | Event: ${e.event} | Reason: ${e.reason || 'N/A'}`);
  });
}
test();
