import { NextResponse } from 'next/server';
import { createShopifyCheckout } from '@/lib/shopifySync';

export async function POST(req) {
  try {
    const { items } = await req.json();
    
    // items is an array of { id: "gid://shopify/ProductVariant/...", quantity: 1 }
    const lineItems = items.map(item => ({
      merchandiseId: item.id,
      quantity: item.quantity
    }));

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
