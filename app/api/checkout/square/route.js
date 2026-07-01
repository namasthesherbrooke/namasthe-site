import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail } from '../../../../lib/brevo';

const isProduction = process.env.SQUARE_ENVIRONMENT === 'production';
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function notifyBaristas(orderNumber, supabaseAdmin, delaySeconds = 0, pickupTime = '') {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const baristaUser = users.find(u => u.email === 'namasthesherbrooke@gmail.com');
    if (baristaUser && baristaUser.user_metadata && baristaUser.user_metadata.push_token) {
      const pushToken = baristaUser.user_metadata.push_token;
      
      const pushMessage = pickupTime && pickupTime !== 'Dès que possible' 
        ? `La commande ${orderNumber} a été payée (Pour: ${pickupTime}).`
        : `La commande ${orderNumber} vient d'être payée et est prête à être préparée.`;

      const message = {
        to: pushToken,
        sound: 'default',
        title: '☕ Nouvelle Commande !',
        body: pushMessage,
        data: { orderNumber },
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      console.log('Notification Push envoyée au Barista');
    }

    if (delaySeconds > 0) {
      // 1. Notification immédiate (Info)
      await fetch('https://ntfy.sh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'namasthe_barista_commandes',
          message: `Commande ${orderNumber} planifiée pour ${pickupTime}.`,
          title: 'COMMANDE PLANIFIÉE 📅',
          priority: 3,
          tags: ['calendar', 'coffee']
        })
      });
      
      // 2. Notification différée (Alarme 10min avant) - On la programme 5 fois avec des délais croissants
      for (let i = 0; i < 5; i++) {
        const extraDelay = delaySeconds + (i * 3);
        await fetch('https://ntfy.sh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: 'namasthe_barista_commandes',
            message: `Il est temps de préparer la commande ${orderNumber} ! (Prévue pour ${pickupTime}) (Alerte ${i+1}/5)`,
            title: 'À PRÉPARER MAINTENANT !',
            priority: 5,
            tags: ['alarm_clock', 'coffee'],
            delay: `${extraDelay}s`
          })
        });
      }
      console.log(`[NTFY] 5 Notifications différées programmées dans ~${delaySeconds}s`);
    } else {
      // Notification immédiate (Alarme 5 fois) avec le délai natif de Ntfy pour contourner Vercel
      const fetchPromises = [];
      for (let i = 0; i < 5; i++) {
        const payload = {
          topic: 'namasthe_barista_commandes',
          message: `Commande ${orderNumber} prête à être préparée ! (Alerte ${i+1}/5)`,
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
          }).catch(e => console.error(e))
        );
      }
      await Promise.all(fetchPromises);
      console.log('Notification ntfy (5x) envoyée');
    }

  } catch (err) {
    console.error('Erreur envoi push notification:', err);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[OLD SQUARE API] Données reçues :', body);

    const { sourceId, amount, subtotal, tps, tvq, cart, user_id, customer_email, customer_name, pickupTime } = body;

    if (!sourceId || !amount || !cart || cart.length === 0) {
      console.log('[OLD SQUARE API] Échec validation');
      return NextResponse.json({ error: 'Données de paiement incomplètes.' }, { status: 400 });
    }

    // Formater le nom du client avec l'heure de cueillette
    const finalCustomerName = pickupTime && pickupTime !== 'Dès que possible' 
      ? `${customer_name || 'Client Web'} (Pour : ${pickupTime})`
      : (customer_name || 'Client Web (ASAP)');

    // Convertir l'amount (ex: 5.50$) en cents pour Square (ex: 550) et forcer le type BigInt
    const amountInCents = BigInt(Math.round(amount * 100));

    const idempotencyKey = crypto.randomUUID();
    
    // Générer un numéro de commande unique et court (ex: NAM-A4F2)
    const orderNumber = 'NAM-' + crypto.randomBytes(2).toString('hex').toUpperCase();

    console.log(`[SQUARE] Création de la commande Square pour l'inventaire...`);

    // Créer la commande (Order) dans Square pour déduire l'inventaire
    const orderRequest = {
      idempotencyKey: idempotencyKey + '_order',
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
                displayName: finalCustomerName,
                emailAddress: customer_email || 'client@namasthe.com'
              }
            }
          }
        ]
      }
    };

    let squareOrderId = undefined;
    try {
      const orderResponse = await squareClient.orders.create(orderRequest);
      const order = orderResponse.data ? orderResponse.data.order : orderResponse.order;
      if (order) {
        squareOrderId = order.id;
        console.log(`[SQUARE] Commande créée avec succès. ID: ${squareOrderId}`);
      }
    } catch (orderError) {
      console.error('[SQUARE ERROR] Impossible de créer la commande Square :', orderError);
      // On continue quand même le paiement sans lier à l'ordre (fallback) si erreur non bloquante ?
      // Normalement, ça devrait toujours fonctionner.
    }

    console.log(`[SQUARE] Traitement d'un paiement de ${amount}$...`);

    // Effectuer le paiement avec Square
    const paymentRequest = {
      sourceId: sourceId,
      idempotencyKey: idempotencyKey,
      buyerEmailAddress: customer_email || undefined,
      amountMoney: {
        amount: amountInCents,
        currency: 'CAD',
      },
      note: `Commande ${orderNumber} - Café Namasthé`,
    };

    if (squareOrderId) {
      paymentRequest.orderId = squareOrderId;
    }

    const paymentResponse = await squareClient.payments.create(paymentRequest);

    const payment = paymentResponse.data ? paymentResponse.data.payment : paymentResponse.payment;

    if (payment.status === 'COMPLETED' || payment.status === 'APPROVED') {
      console.log('[SQUARE] Paiement réussi ! ID:', payment.id);

      // Créer la commande dans Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: finalCustomerName,
          customer_email: customer_email || null,
          user_id: user_id || null,
          order_number: orderNumber,
          total_amount: amount,
          status: 'pending',
          clover_payment_id: payment.id // Réutilisation de la colonne pour l'ID de paiement
        })
        .select()
        .single();

      if (orderError) {
        console.error('Erreur insertion commande Supabase:', orderError);
        // Le paiement a fonctionné mais on n'a pas pu l'enregistrer dans DB.
        // À gérer selon la criticité.
      } else {
        const orderItems = cart.map(item => ({
          order_id: orderData.id,
          custom_instructions: `${item.name} - ${item.price}$`,
          quantity: item.quantity,
          item_total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Erreur insertion items:', itemsError);
        }
      }

      // Mise à jour des points de fidélité automatiquement
      if (user_id) {
        try {
          const pointsToAdd = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          const { data: profile } = await supabase.from('profiles').select('fidelite_points, tickets').eq('id', user_id).single();
          
          let currentPoints = profile ? (profile.fidelite_points || 0) : 0;
          let currentTickets = profile ? (profile.tickets || 0) : 0;
          currentPoints += pointsToAdd;
          
          while (currentPoints >= 10) {
            currentPoints -= 10;
            currentTickets += 1;
          }
          
          // Utilisation de upsert au cas où le profil n'existe pas encore
          await supabase.from('profiles').upsert({ 
            id: user_id, 
            prenom: finalCustomerName.split(' ')[0],
            nom: finalCustomerName.split(' ').slice(1).join(' '),
            fidelite_points: currentPoints, 
            tickets: currentTickets 
          });
          
          console.log(`[FIDELITE] ${pointsToAdd} points ajoutés à l'utilisateur ${user_id}. Nouveau total: ${currentPoints} points, ${currentTickets} tickets.`);
        } catch (fideliteError) {
          console.error('Erreur lors de l\'ajout des points de fidélité:', fideliteError);
        }
      }

      // Envoi du reçu par courriel
      if (customer_email) {
        const receiptUrl = payment.receiptUrl || payment.receipt_url || '';
        // On envoie le reçu peu importe si Square nous donne un lien
        sendReceiptEmail(customer_email, finalCustomerName, orderNumber, amount, receiptUrl, subtotal, tps, tvq, pickupTime).catch(console.error);
      }

      let delaySeconds = 0;
      if (pickupTime && pickupTime !== 'Dès que possible') {
        try {
          const parts = pickupTime.split(' à ');
          if (parts.length === 2) {
            const timeParts = parts[1].split('h');
            const targetHour = parseInt(timeParts[0], 10);
            const targetMin = parseInt(timeParts[1], 10) || 0;
            
            let targetDate = new Date();
            
            if (parts[0] === "Demain") {
              targetDate.setDate(targetDate.getDate() + 1);
            } else if (parts[0] !== "Aujourd'hui") {
              const dayMatch = parts[0].match(/\d+/);
              if (dayMatch) {
                targetDate.setDate(parseInt(dayMatch[0], 10));
                if (targetDate.getDate() < new Date().getDate()) {
                  targetDate.setMonth(targetDate.getMonth() + 1);
                }
              }
            }
            
            targetDate.setHours(targetHour, targetMin, 0, 0);
            
            // Avertir 10 minutes avant
            targetDate.setMinutes(targetDate.getMinutes() - 10);
            
            const now = new Date();
            if (targetDate > now) {
              delaySeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
            }
          }
        } catch (e) {
          console.error('[SQUARE] Erreur parse pickupTime:', e);
        }
      }

      // Envoi notification Push au Barista
      notifyBaristas(orderNumber, supabase, delaySeconds, pickupTime).catch(console.error);

      return NextResponse.json({ success: true, paymentId: payment.id, orderNumber: orderNumber });
    } else {
      return NextResponse.json({ error: 'Le paiement a été refusé par Square.' }, { status: 400 });
    }
  } catch (error) {
    console.error('[SQUARE ERROR]', error);
    
    // Si c'est une erreur Square API
    if (error.errors && error.errors.length > 0) {
      return NextResponse.json({ error: error.errors[0].detail }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
