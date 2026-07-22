import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Le numéro de commande Shopify (ex: #1001)
    const orderNumber = body.name || body.order_number || 'inconnue';
    
    console.log(`[SHOPIFY WEBHOOK] Nouvelle commande reçue: ${orderNumber}`);

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

    return NextResponse.json({ success: true, message: 'Webhook Shopify traité, tablette notifiée.' });
  } catch (error) {
    console.error("Shopify Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
