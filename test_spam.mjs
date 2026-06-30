import fetch from 'node-fetch';

(async () => {
  for (let i = 0; i < 5; i++) {
    await fetch('https://ntfy.sh/', {
      method: 'POST',
      body: JSON.stringify({
        topic: 'namasthe_barista_commandes',
        message: `TEST SPAM SERVEUR 🛎️ (Alerte ${i+1}/5) - Est-ce que ça sonne plusieurs fois ?`,
        title: 'BOMBARDEMENT ACTIVÉ',
        priority: 5,
        tags: ['coffee', 'bell']
      }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(e => console.error(e));
    if (i < 4) await new Promise(r => setTimeout(r, 2500));
  }
})();
