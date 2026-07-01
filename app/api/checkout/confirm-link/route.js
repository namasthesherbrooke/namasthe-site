import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReceiptEmail } from '@/lib/brevo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cette route est appelée via une redirection GET par Square une fois le paiement complété.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get('orderNumber');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xn--cafnamasthsherbrooke-d2bh.com';

    if (!orderNumber) {
      return NextResponse.redirect(`${appUrl}/`);
    }

    // Récupérer la commande brouillon
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (orderError || !orderData) {
      console.error('[CONFIRM-LINK] Erreur récupération commande:', orderError);
      return NextResponse.redirect(`${appUrl}/historique-commandes`);
    }

    // Si la commande est déjà traitée, on redirige simplement
    if (orderData.status !== 'draft') {
      return NextResponse.redirect(`${appUrl}/commande/statut?numero=${orderNumber}`);
    }

    // Mettre à jour le statut à 'pending'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('id', orderData.id);

    if (updateError) {
      console.error('[CONFIRM-LINK] Erreur mise à jour statut:', updateError);
    } else {
      console.log(`[CONFIRM-LINK] Commande ${orderNumber} confirmée et passée en pending.`);

      // Extraire pickupTime si présent dans customer_name
      let pickupTime = '';
      if (orderData.customer_name.includes('(Pour : ')) {
        pickupTime = orderData.customer_name.split('(Pour : ')[1].replace(')', '');
      }

      // Calculer sous-total et taxes approximativement pour le reçu (puisque ce n'est pas stocké séparément pour le moment)
      const totalAmount = parseFloat(orderData.total_amount);
      const subtotal = (totalAmount / 1.14975).toFixed(2);
      const tps = (subtotal * 0.05).toFixed(2);
      const tvq = (subtotal * 0.09975).toFixed(2);

      // Envoyer le reçu
      if (orderData.customer_email) {
        sendReceiptEmail(
          orderData.customer_email,
          orderData.customer_name,
          orderData.order_number,
          totalAmount,
          '', // Pas de lien de reçu Square disponible ici directement
          parseFloat(subtotal),
          parseFloat(tps),
          parseFloat(tvq),
          pickupTime
        ).catch(err => console.error('[CONFIRM-LINK] Erreur envoi reçu Brevo:', err));
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
          console.error('[CONFIRM-LINK] Erreur parse pickupTime:', e);
        }
      }

      // Mise à jour des points de fidélité automatiquement
      if (orderData.user_id) {
        try {
          const pointsToAdd = (orderData.order_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          const { data: profile } = await supabase.from('profiles').select('fidelite_points, tickets').eq('id', orderData.user_id).single();
          if (profile) {
            let currentPoints = profile.fidelite_points || 0;
            let currentTickets = profile.tickets || 0;
            currentPoints += pointsToAdd;
            while (currentPoints >= 10) {
              currentPoints -= 10;
              currentTickets += 1;
            }
            await supabase.from('profiles').update({ fidelite_points: currentPoints, tickets: currentTickets }).eq('id', orderData.user_id);
            console.log(`[FIDELITE] ${pointsToAdd} points ajoutés à l'utilisateur ${orderData.user_id}.`);
          }
        } catch (fideliteError) {
          console.error('Erreur lors de l\'ajout des points de fidélité:', fideliteError);
        }
      }

      // Notifier les baristas
      notifyBaristas(orderNumber, supabase, delaySeconds, pickupTime).catch(console.error);
    }

    // Rediriger le client vers sa page de suivi
    return NextResponse.redirect(`${appUrl}/commande/statut?numero=${orderNumber}`);

  } catch (error) {
    console.error('[CONFIRM-LINK] Erreur globale:', error);
    const fallbackAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xn--cafnamasthsherbrooke-d2bh.com';
    return NextResponse.redirect(`${fallbackAppUrl}/`);
  }
}

async function notifyBaristas(orderNumber, supabaseAdmin, delaySeconds = 0, pickupTime = '') {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const baristaUser = users.find(u => u.email === 'namasthesherbrooke@gmail.com');
    if (baristaUser && baristaUser.user_metadata && baristaUser.user_metadata.push_token) {
      const pushToken = baristaUser.user_metadata.push_token;
      
      const pushMessage = pickupTime && pickupTime !== 'Dès que possible' 
        ? `La commande ${orderNumber} a été payée (Pour: ${pickupTime}).`
        : `La commande ${orderNumber} vient d'être payée et est en attente de préparation.`;

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
          body: pushMessage,
          data: { orderNumber },
        }),
      });
      console.log('[EXPO PUSH] Notification envoyée au Barista');
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
      console.log('[NTFY] Notification sonore d\'urgence envoyée');
    }

  } catch (err) {
    console.error('Erreur notifyBaristas:', err);
  }
}
