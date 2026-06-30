const { exec } = require('child_process');
const path = require('path');

console.log("Démon de synchronisation Square démarré. L'inventaire sera mis à jour toutes les 15 minutes.");

// Exécuter immédiatement une première fois au démarrage
runSync();

// Ensuite, exécuter toutes les 15 minutes
setInterval(runSync, 15 * 60 * 1000);

function runSync() {
  console.log(`[${new Date().toISOString()}] Lancement de la synchronisation automatique...`);
  
  const scriptPath = path.resolve(__dirname, 'import_square.js');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[ERREUR DAEMON] : ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[ERREUR SCRIPT] : ${stderr}`);
    }
    console.log(`[SUCCÈS] :\n${stdout}`);
  });
}
