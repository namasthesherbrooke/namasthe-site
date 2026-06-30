const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpbavzawkozlcsnszlpr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYmF2emF3a296bGNzbnN6bHByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTg4MSwiZXhwIjoyMDk1MDQ3ODgxfQ.OFuNsYSiNFyYQLew4ZkhnqnTBFxc-i6JnaZcluIiOAY';

async function migrate() {
  console.log("Starting migration...");
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, { headers });
  const products = await res.json();

  if (!Array.isArray(products)) {
    console.error("Error fetching products:", products);
    return;
  }

  let migratedCount = 0;

  for (const product of products) {
    if (product.allowed_ingredients && Array.isArray(product.allowed_ingredients) && product.allowed_ingredients.length > 0) {
      const firstItem = product.allowed_ingredients[0];
      if (typeof firstItem === 'string') {
        const migratedIngredients = product.allowed_ingredients.map(id => ({
          id,
          free_qty: 1 // Default to 1 free
        }));
        
        console.log(`Migrating product ${product.name}...`);
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${product.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ allowed_ingredients: migratedIngredients })
        });
        
        if (!updateRes.ok) {
          console.error(`Failed to update ${product.name}:`, await updateRes.text());
        } else {
          migratedCount++;
        }
      }
    }
  }

  console.log(`Migration complete. Migrated ${migratedCount} products.`);
}

migrate();
