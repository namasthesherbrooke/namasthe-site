async function check() {
  const res = await fetch('http://localhost:3000/api/menu');
  const data = await res.json();
  const items = data.menu.items;
  const creez = items.find(i => i.name.toLowerCase().includes('créez le de toute pièce') || i.name.toLowerCase().includes('creez'));
  console.log(JSON.stringify(creez, null, 2));
}
check();
