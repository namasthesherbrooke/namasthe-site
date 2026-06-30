const { SquareClient, SquareEnvironment } = require('square');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Charger les variables d'environnement
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2].replace(/['"]/g, '').trim();
  }
});

if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 3. Initialiser Square (Utiliser Sandbox par défaut pour les tests, ou Production si configuré)
const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function importSquareCatalog() {
  console.log(`[SQUARE] Démarrage de la synchronisation de l'inventaire (${isProduction ? 'Production' : 'Sandbox'})...`);

  try {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      throw new Error("La variable SQUARE_ACCESS_TOKEN n'est pas définie dans .env.local");
    }

    // Récupérer le catalogue (seulement les ITEM)
    const response = await squareClient.catalog.list({ types: 'ITEM' });
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      console.log("[SQUARE] Aucun produit trouvé dans le catalogue Square.");
      return;
    }

    const items = response.data;
    console.log(`[SQUARE] ${items.length} produits trouvés. Mise à jour de Supabase...`);

    let importedCount = 0;

    const squareProductNames = items.map(item => item.itemData.name);

    for (const item of items) {
      const itemData = item.itemData;
      
      // Obtenir le prix depuis la première variation (si disponible)
      let basePrice = 0;
      if (itemData.variations && itemData.variations.length > 0) {
        const variation = itemData.variations[0].itemVariationData;
        if (variation.priceMoney && variation.priceMoney.amount) {
          // Square stocke les montants en cents (ex: 500 = 5.00$)
          basePrice = Number(variation.priceMoney.amount) / 100;
        }
      }

      // Par défaut, catégorie
      const category = itemData.categoryId || 'Général';
      const name = itemData.name;
      const description = itemData.description || '';
      
      // Mettre à jour ou insérer (Upsert) dans Supabase
      const { error } = await supabase
        .from('products')
        .upsert(
          {
            name: name,
            description: description,
            base_price: basePrice,
            category: category,
            is_active: !item.isDeleted,
          },
          { onConflict: 'name' }
        );

      if (error) {
        console.error(`[ERREUR] Impossible d'importer '${name}':`, error.message);
      } else {
        console.log(`[SUCCÈS] Produit importé/mis à jour : ${name} (${basePrice}$)`);
        importedCount++;
      }
    }

    // Désactiver les produits qui ne sont plus dans Square
    const { data: activeProducts } = await supabase.from('products').select('id, name').eq('is_active', true);
    if (activeProducts) {
      let deactivatedCount = 0;
      for (const p of activeProducts) {
        if (!squareProductNames.includes(p.name)) {
          await supabase.from('products').update({ is_active: false }).eq('id', p.id);
          console.log(`[DÉSACTIVÉ] L'ancien produit '${p.name}' a été caché car il n'est pas dans Square.`);
          deactivatedCount++;
        }
      }
    }

    console.log(`[TERMINÉ] ${importedCount} produits importés avec succès depuis Square.`);
  } catch (error) {
    console.error("[ERREUR] Erreur lors de la synchronisation Square:", error);
  }
}

importSquareCatalog();
