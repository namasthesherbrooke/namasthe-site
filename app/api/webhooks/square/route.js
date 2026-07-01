import { NextResponse } from 'next/server';
import { syncSquareCatalog } from '@/lib/squareSync';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail } from '@/lib/brevo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[SQUARE WEBHOOK] Reçu:', body?.type);

    // Traitement des paiements (Fallback si le client ferme l'app)
    if (body?.type === 'payment.updated' || body?.type === 'payment.created') {
      const payment = body?.data?.object?.payment;
      
      if (payment && (payment.status === 'COMPLETED' || payment.status === 'APPROVED')) {
        const squareOrderId = payment.order_id;
        
        if (squareOrderId) {
          // Vérifier si on a un brouillon pour cette commande
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('clover_payment_id', squareOrderId)
            .single();

          if (!orderError && orderData && orderData.status === 'draft') {
            // Mettre à jour en pending
            await supabase
              .from('orders')
              .update({ status: 'pending' })
              .eq('id', orderData.id);
            
            console.log(`[SQUARE WEBHOOK] Commande ${orderData.order_number} passée en pending via Webhook !`);

            let pickupTime = '';
            if (orderData.customer_name.includes('(Pour : ')) {
              pickupTime = orderData.customer_name.split('(Pour : ')[1].replace(')', '');
            }

            const totalAmount = parseFloat(orderData.total_amount);
            const subtotal = (totalAmount / 1.14975).toFixed(2);
            const tps = (subtotal * 0.05).toFixed(2);
            const tvq = (subtotal * 0.09975).toFixed(2);

            if (orderData.customer_email) {
              sendReceiptEmail(
                orderData.customer_email,
                orderData.customer_name,
                orderData.order_number,
                totalAmount,
                '', 
                parseFloat(subtotal),
                parseFloat(tps),
                parseFloat(tvq),
                pickupTime
              ).catch(err => console.error('[WEBHOOK] Erreur email:', err));
            }

            notifyBaristas(orderData.order_number, supabase).catch(console.error);
          }
        }
      }
      return NextResponse.json({ success: true, message: 'Webhook paiement traité.' });
    }

    // Si c'est autre chose (probablement catalog.version.updated), on synchronise le catalogue
    await syncSquareCatalog();
    
    return NextResponse.json({ success: true, message: 'Webhook reçu, catalogue synchronisé.' });
  } catch (error) {
    console.error("Square Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function notifyBaristas(orderNumber, supabaseAdmin) {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const baristaUser = users.find(u => u.email === 'namasthesherbrooke@gmail.com');
    if (baristaUser && baristaUser.user_metadata && baristaUser.user_metadata.push_token) {
      const pushToken = baristaUser.user_metadata.push_token;
      
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          title: 'Nouvelle Commande ! ☕',
          body: `La commande ${orderNumber} vient d'être payée et est en attente de préparation.`,
          data: { orderNumber },
        }),
      });
      console.log('[EXPO PUSH] Notification envoyée au Barista');
    }

    // NOUVEAU: Envoi d'une notification d'urgence via ntfy.sh (Bypass Android Doze Mode)
    // On envoie 5 requêtes avec le délai natif de Ntfy pour contourner Vercel
    const fetchPromises = [];
    for (let i = 0; i < 5; i++) {
      const payload = {
        topic: 'namasthe_barista_commandes',
        message: i === 0 ? `Commande ${orderNumber} payée en magasin !` : `Commande ${orderNumber} payée en magasin ! (Alerte ${i+1}/5)`,
        title: 'NOUVELLE COMMANDE NAMASTHE !',
        priority: 5,
        tags: ['coffee', 'bell']
      };
      if (i > 0) {
        payload.delay = `${i * 3}s`;
      }
      fetchPromises.push(
        fetch('https://ntfy.sh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(e => console.error(e))
      );
    }
    await Promise.all(fetchPromises);
    console.log('[NTFY] Notification sonore d\'urgence envoyée');

  } catch (err) {
    console.error('Erreur notifyBaristas:', err);
  }
}
