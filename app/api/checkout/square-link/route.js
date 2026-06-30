import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[SQUARE LINK] Données reçues :', body);
    
    const { amount, cart, user_id, customer_email, customer_name, pickupTime } = body;

    if (!amount || !cart || cart.length === 0) {
      console.log('[SQUARE LINK] Échec validation:', { amount, cartLen: cart?.length });
      return NextResponse.json({ error: 'Données de paiement incomplètes.' }, { status: 400 });
    }

    const amountInCents = BigInt(Math.round(amount * 100));
    const idempotencyKey = crypto.randomUUID();
    const orderNumber = 'NAM-APP-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    // App URL pour le retour
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xn--cafnamasthsherbrooke-d2bh.com';
    const redirectUrl = `${appUrl}/api/checkout/confirm-link?orderNumber=${orderNumber}`;

    // Créer le lien de paiement (Checkout) avec l'order intégré (Inline Order)
    const checkoutResponse = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: idempotencyKey,
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        lineItems: cart.map(item => {
          const lineItem = {
            name: item.name,
            quantity: String(item.quantity || 1),
            basePriceMoney: {
              amount: BigInt(Math.round(item.price * 100)),
              currency: 'CAD'
            }
          };
          if (item.base_product_id && !item.base_product_id.includes('custom') && item.base_product_id !== 'base') {
            lineItem.catalogObjectId = item.base_product_id;
          }
          return lineItem;
        }),
        taxes: [
          {
            name: "TPS/TVQ",
            percentage: "14.975",
            scope: "ORDER"
          }
        ],
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              scheduleType: "ASAP",
              recipient: {
                displayName: customer_name || 'Client App',
                emailAddress: customer_email || 'client@namasthe.com'
              }
            }
          }
        ]
      },
      checkoutOptions: {
        askForShippingAddress: false,
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
        },
        redirectUrl: redirectUrl
      },
    });

    const paymentLink = checkoutResponse.paymentLink || (checkoutResponse.result && checkoutResponse.result.paymentLink);
    const squareOrderId = paymentLink.orderId;

    // Calculs de taxes et sous-total (utiles pour le reçu si on en a besoin plus tard)
    // Ici, le Client App envoie l'amount avec taxes. 
    // On sauvegarde la commande en mode DRAFT.
    let finalCustomerName = customer_name || 'Client App';
    if (pickupTime) {
      finalCustomerName += ` (Pour : ${pickupTime})`;
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: finalCustomerName,
        customer_email: customer_email || null,
        user_id: user_id || null,
        order_number: orderNumber,
        total_amount: amount,
        status: 'draft',
        clover_payment_id: squareOrderId
      })
      .select()
      .single();

    if (!orderError && orderData) {
      const orderItems = cart.map(item => {
        const qty = item.quantity || 1;
        return {
          order_id: orderData.id,
          custom_instructions: `${item.name} - ${item.price}$`,
          quantity: qty,
          item_total_price: item.price * qty
        };
      });
      const { error: insertError } = await supabase.from('order_items').insert(orderItems);
      if (insertError) console.error('[SQUARE LINK] Erreur insertion items:', insertError);
    } else {
      console.error('[SQUARE LINK] Erreur création commande brouillon:', orderError);
    }

    return NextResponse.json({ url: paymentLink.url, orderId: squareOrderId, orderNumber: orderNumber });

  } catch (error) {
    console.error('[SQUARE LINK ERROR]', error);
    return NextResponse.json({ error: 'Erreur lors de la création du lien de paiement.' }, { status: 500 });
  }
}
