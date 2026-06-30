const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('/home/namasthe/Documents/Antigravity/Namasthé/site/app/page.js', 'utf-8');
try {
  acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  console.log('Syntax OK');
} catch (e) {
  console.error('Syntax Error:', e.message);
}
