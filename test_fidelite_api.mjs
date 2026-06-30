import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/fidelite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: '0ae572d3-8730-401b-a5a4-fe4b2a8472f0', action: 'add', password: 'NamastheAdmin!' })
  });
  const data = await res.json();
  console.log(data);
}
test();
