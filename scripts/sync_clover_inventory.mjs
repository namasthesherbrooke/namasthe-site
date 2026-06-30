import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cloverMerchantId = process.env.CLOVER_MERCHANT_ID;
const cloverToken = process.env.CLOVER_INVENTORY_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncInventory() {
  if (!cloverToken || !cloverMerchantId) {
    console.error("Missing Clover credentials (CLOVER_MERCHANT_ID or CLOVER_INVENTORY_TOKEN)");
    process.exit(1);
  }

  console.log(`Fetching items for Merchant ID: ${cloverMerchantId}...`);
  
  const cloverApiUrl = `https://api.clover.com/v3/merchants/${cloverMerchantId}/items?expand=categories&limit=1000`;
  
  try {
    const response = await fetch(cloverApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cloverToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch from Clover: ${response.status} ${response.statusText}`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    const items = data.elements;

    console.log(`Found ${items.length} items in Clover.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      // Filtrer les rabais
      const name = item.name || '';
      const nameLower = name.toLowerCase();
      
      if (nameLower.includes('rabais') || nameLower.includes('discount')) {
        console.log(`Skipping (discount): ${name}`);
        skippedCount++;
        continue;
      }

      // Prix: Clover le donne en cents, on le convertit en dollars
      const price = item.price ? (item.price / 100).toFixed(2) : '0.00';
      
      // Catégorie
      let category = 'Général';
      if (item.categories && item.categories.elements && item.categories.elements.length > 0) {
        category = item.categories.elements[0].name;
      }

      // Upsert into Supabase
      const { error } = await supabase
        .from('products')
        .upsert({
          name: name,
          base_price: parseFloat(price),
          category: category,
          is_active: true
        }, {
          onConflict: 'name'
        });

      if (error) {
        console.error(`Error upserting ${name}:`, error.message);
      } else {
        console.log(`Synced: ${name} ($${price}) - [${category}]`);
        insertedCount++;
      }
    }

    console.log(`\nSync complete!`);
    console.log(`Items synced: ${insertedCount}`);
    console.log(`Items skipped (discounts): ${skippedCount}`);

  } catch (err) {
    console.error("Error during sync:", err);
  }
}

syncInventory();
