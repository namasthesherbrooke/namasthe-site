import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getAttributes() {
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts/attributes', {
      headers: {
        'Accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
getAttributes();
