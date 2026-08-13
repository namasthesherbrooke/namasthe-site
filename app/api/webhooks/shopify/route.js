import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Le numéro de commande Shopify (ex: #1001)
    const orderNumber = body.name || body.order_number || 'inconnue';
    const note = body.note || '';
    
    console.log(`[SHOPIFY WEBHOOK] Nouvelle commande reçue: ${orderNumber}`);

    // Sauvegarde de la commande dans Supabase
    const customerName = body.customer ? `${body.customer.first_name || ''} ${body.customer.last_name || ''}`.trim() : 'Client Shopify';
    let finalCustomerName = customerName || 'Client App';
    if (note) {
      finalCustomerName += ` (Pour : ${note})`;
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: finalCustomerName,
        customer_email: body.customer?.email || null,
        order_number: orderNumber.toString(),
        total_amount: body.total_price || 0,
        status: 'pending',
        clover_payment_id: (body.id || '').toString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('[SHOPIFY WEBHOOK] Erreur création commande dans Supabase:', orderError);
    } else if (orderData && body.line_items) {
      const orderItems = body.line_items.map(item => ({
        order_id: orderData.id,
        custom_instructions: `${item.title || item.name} - ${item.price}$`,
        quantity: item.quantity,
        item_total_price: parseFloat(item.price) * item.quantity
      }));
      const { error: insertError } = await supabase.from('order_items').insert(orderItems);
      if (insertError) console.error('[SHOPIFY WEBHOOK] Erreur insertion items:', insertError);
    }

    // Envoi d'une notification d'urgence via ntfy.sh (Bypass Android Doze Mode)
    const fetchPromises = [];
    for (let i = 0; i < 5; i++) {
      const payload = {
        topic: 'namasthe_barista_commandes',
        message: i === 0 ? `Commande ${orderNumber} payée en ligne (Shopify) !` : `Commande ${orderNumber} payée ! (Alerte ${i+1}/5)`,
        title: 'NOUVELLE COMMANDE NAMASTHE !',
        priority: 5,
        tags: ['coffee', 'bell']
      };
      
      if (i > 0) {
        payload.delay = `${i * 10}s`;
      }
      
      fetchPromises.push(
        fetch('https://ntfy.sh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(e => console.error('[NTFY ERROR]', e))
      );
    }
    
    await Promise.all(fetchPromises);
    console.log('[NTFY] Notification sonore d\'urgence envoyée à la tablette');

    return NextResponse.json({ success: true, message: 'Webhook Shopify traité, commande enregistrée et tablette notifiée.' });
  } catch (error) {
    console.error("Shopify Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
