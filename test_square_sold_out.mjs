import fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf-8');
const tokenMatch = envFile.match(/SQUARE_ACCESS_TOKEN=(.+)/);
const SQR_TOKEN = tokenMatch ? tokenMatch[1].trim() : null;

const url = `https://connect.squareup.com/v2/catalog/list?types=ITEM,MODIFIER_LIST`;

async function test() {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${SQR_TOKEN}` }
  });
  const data = await res.json();
  const items = data.objects.filter(o => o.type === 'ITEM');
  
  // Find an item that has a location_override or inventory or sold_out
  for (let item of items) {
    if (item.item_data.variations) {
      for (let v of item.item_data.variations) {
        if (v.item_variation_data.location_overrides) {
            console.log("Item Variation:", v.item_variation_data.name);
            console.log("  Overrides:", JSON.stringify(v.item_variation_data.location_overrides));
        }
      }
    }
  }

  const mods = data.objects.filter(o => o.type === 'MODIFIER_LIST');
  for (let ml of mods) {
     if (ml.modifier_list_data.modifiers) {
         for (let m of ml.modifier_list_data.modifiers) {
             if (m.modifier_data.location_overrides) {
                 console.log("Modifier:", m.modifier_data.name);
                 console.log("  Overrides:", JSON.stringify(m.modifier_data.location_overrides));
             }
         }
     }
  }
}
test();
