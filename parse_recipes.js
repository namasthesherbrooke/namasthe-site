const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'recettes.csv');
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n');
const recipes = [];
const allFlavors = new Set();

for (let i = 1; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line) continue;

  // Handles quoted strings for the flavors (e.g. "Fraise, Limonade, Matcha")
  // Format: Name,"Flavor1, Flavor2" OR Name,Flavor1
  let name, flavorsStr;
  const firstComma = line.indexOf(',');
  if (firstComma === -1) continue;
  
  name = line.substring(0, firstComma).trim();
  flavorsStr = line.substring(firstComma + 1).trim();

  // Remove surrounding quotes if they exist
  if (flavorsStr.startsWith('"') && flavorsStr.endsWith('"')) {
    flavorsStr = flavorsStr.substring(1, flavorsStr.length - 1);
  }

  const flavorsList = flavorsStr.split(',').map(f => {
    // Nettoyer : enlever les guillemets, parenthèses, et les prix comme "25$"
    let cleaned = f.replace(/["\(\)]/g, '').replace(/\d+\s*\$\s*/g, '').trim();
    // Enlever " collagène", " hydratation" si ça vient avec des prix (comme vu sur la photo) ou nettoyer plus agressivement
    // Enlever tout mot qui suit un prix s'il est un extra non désiré ? En fait, on garde juste le nom de saveur nettoyé.
    cleaned = cleaned.replace(/collagène|hydratation/ig, '').trim();
    return cleaned;
  }).filter(f => f.length > 0);
  
  const normalizedFlavors = flavorsList.map(f => {
    // Minuscule, puis 1ère lettre majuscule
    const lower = f.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  
  // Utiliser un Set pour éviter les doublons de saveurs DANS LA MÊME RECETTE
  const uniqueFlavors = Array.from(new Set(normalizedFlavors));
  
  uniqueFlavors.forEach(f => {
    allFlavors.add(f);
  });
  
  recipes.push({
    id: i,
    name: name,
    flavors: uniqueFlavors
  });
}

const outputPath = path.join(__dirname, 'app', 'data', 'recipes.json');
fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2));

console.log(`Successfully parsed ${recipes.length} recipes. Found ${allFlavors.size} unique flavors.`);
console.log('Unique flavors:', Array.from(allFlavors).sort().join(', '));
