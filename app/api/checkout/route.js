import { NextResponse } from 'next/server';
import { createShopifyCheckout, getShopifyProducts } from '@/lib/shopifySync';

export async function POST(req) {
  try {
    const { items } = await req.json();
    
    // 1. Fetch Shopify catalog to map items
    const shopifyProducts = await getShopifyProducts();
    const allShopifyNodes = shopifyProducts ? shopifyProducts.map(e => e.node) : [];

    const lineItems = items.map(item => {
      let matchedVariantId = null;
      let highestScore = 0;
      let fallbackVariantId = null;

      // Normaliser le nom du produit du panier
      const cartNameNormalized = (item.name || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();

      allShopifyNodes.forEach(pNode => {
        const pTitle = pNode.title.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        // Si le nom du produit Shopify est contenu dans le nom du panier
        if (pTitle && cartNameNormalized.includes(pTitle)) {
          pNode.variants.edges.forEach(vEdge => {
            const vTitle = vEdge.node.title.toLowerCase().replace(/[^\w\s]/gi, '').trim();
            fallbackVariantId = vEdge.node.id;

            if (vEdge.node.title !== 'Default Title' && cartNameNormalized.includes(vTitle)) {
               matchedVariantId = vEdge.node.id;
               highestScore = 2; // Match du produit ET de la variante (ex: 16 oz)
            } else if (highestScore < 1) {
               matchedVariantId = vEdge.node.id;
               highestScore = 1; // Match du produit seulement
            }
          });
        }
      });

      if (!matchedVariantId && fallbackVariantId) {
        matchedVariantId = fallbackVariantId;
      }

      if (!matchedVariantId) {
        throw new Error(`Produit introuvable dans le catalogue Shopify : ${item.name}`);
      }

      const line = {
        merchandiseId: matchedVariantId,
        quantity: item.quantity,
        attributes: [
           { key: "Nom Original (Avec Saveurs)", value: item.name }
        ]
      };
      
      if (item.attributes && item.attributes.length > 0) {
        item.attributes.forEach(attr => {
           if (attr.key !== "Nom Original (Avec Saveurs)") {
             line.attributes.push(attr);
           }
        });
      }
      return line;
    });

    const cart = await createShopifyCheckout(lineItems);
    
    if (cart && cart.checkoutUrl) {
      return NextResponse.json({ success: true, url: cart.checkoutUrl });
    } else {
      throw new Error("Impossible de créer le panier Shopify");
    }
  } catch (error) {
    console.error("Erreur Checkout:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
