import { NextResponse } from 'next/server';
import { createShopifyCheckout } from '@/lib/shopifySync';

export async function POST(req) {
  try {
    const { items } = await req.json();
    
    const lineItems = items.map(item => {
      const line = {
        merchandiseId: item.id,
        quantity: item.quantity
      };
      if (item.attributes && item.attributes.length > 0) {
        line.attributes = item.attributes;
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
