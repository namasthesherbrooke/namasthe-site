import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const brevoKeyMatch = envFile.match(/BREVO_API_KEY=(.+)/);
const brevoKey = brevoKeyMatch ? brevoKeyMatch[1].trim() : null;

if (!brevoKey) {
  console.log("No BREVO_API_KEY in .env.local");
  process.exit(1);
}

const payload = {
  sender: { name: 'Café Namasthé', email: 'namasthesherbrooke@gmail.com' },
  to: [{ email: 'mathiew_lacroix@outlook.com', name: 'Mathiew' }],
  subject: 'Test Brevo avec nouvelle adresse',
  htmlContent: '<p>Ceci est un test pour voir si namasthesherbrooke@gmail.com fonctionne comme expéditeur.</p>'
};

async function test() {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('Erreur Brevo:', JSON.stringify(errorData, null, 2));
  } else {
    console.log('Test email envoyé avec succès à mathiew_lacroix@outlook.com !');
  }
}
test();
