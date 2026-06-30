const { SquareClient, SquareEnvironment } = require('square');
const crypto = require('crypto');

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: 'EAAAl3SsZ71mYwoEcS3GUwmheyyBTTPIExpVrJVzu6jdaGrtCp0_ieLxQveynH-i', // User's real token
  environment: SquareEnvironment.Production,
});

async function createTestProduct() {
  try {
    const idempotencyKey = crypto.randomUUID();

    const response = await squareClient.catalog.batchUpsert({
      idempotencyKey: idempotencyKey,
      batches: [{
        objects: [
          {
            type: 'ITEM',
            id: '#test-item-1',
            itemData: {
              name: 'Produit de Test (Ne pas effacer)',
              description: 'Ceci est un produit de test pour vérifier le site web.',
              categoryId: '',
              variations: [
                {
                  type: 'ITEM_VARIATION',
                  id: '#test-variation-1',
                  itemVariationData: {
                    itemId: '#test-item-1',
                    name: 'Régulier',
                    pricingType: 'FIXED_PRICING',
                    priceMoney: {
                      amount: 100n, // 100 cents = 1.00$
                      currency: 'CAD',
                    },
                  },
                },
              ],
            },
          }
        ]
      }]
    });

    console.log('[SQUARE] Produit de test créé avec succès !');
    console.log(response.data);
  } catch (error) {
    console.error('[ERREUR] Impossible de créer le produit:', error);
  }
}

createTestProduct();
