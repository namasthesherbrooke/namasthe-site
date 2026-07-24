export const sendReceiptEmail = async (email, name, orderNumber, amount, receiptUrl, subtotal, tps, tvq, pickupTime, orderItems = []) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY non configurée. Envoi du reçu ignoré.');
    return;
  }

  // Si on n'a pas les infos séparées (vieilles commandes par ex), on affiche juste le total
  const hasTaxes = subtotal !== undefined && tps !== undefined && tvq !== undefined;

  let itemsHtml = '';
  if (orderItems && orderItems.length > 0) {
    itemsHtml = `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2C1810; border-bottom: 1px solid #eee; padding-bottom: 10px;">Articles de la commande</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${orderItems.map(item => `
            <tr>
              <td style="padding: 8px 0; color: #333;">${item.quantity}x ${item.custom_instructions || item.name}</td>
              <td style="text-align: right; padding: 8px 0; color: #555; white-space: nowrap;">${Number(item.item_total_price).toFixed(2)} $</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  const payload = {
    sender: { name: 'Café Namasthé', email: 'namasthesherbrooke@gmail.com' }, // Utilisation de l'email admin supposé vérifié
    to: [{ email: email, name: name || 'Client' }],
    subject: `Votre reçu pour la commande ${orderNumber}`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2C1810; text-align: center;">Merci pour votre commande !</h2>
        <p>Bonjour ${name ? name.split(' (')[0] : ''},</p>
        <p>Votre paiement a été traité avec succès.</p>
        
        ${pickupTime && pickupTime !== 'Dès que possible' ? `
        <div style="background-color: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #4ADE80;">
          <h3 style="margin-top: 0; color: #2E7D32;">⏱ Heure de préparation prévue</h3>
          <p style="margin-bottom: 0; font-size: 1.1em; font-weight: bold;">${pickupTime}</p>
        </div>
        ` : ''}

        ${itemsHtml}

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2C1810; border-bottom: 1px solid #eee; padding-bottom: 10px;">Détails de facturation</h3>
          ${hasTaxes ? `
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #555;">Sous-total :</td>
                <td style="text-align: right; padding: 5px 0;">${Number(subtotal).toFixed(2)} $</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #555;">TPS (5%) :</td>
                <td style="text-align: right; padding: 5px 0;">${Number(tps).toFixed(2)} $</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #555;">TVQ (9.975%) :</td>
                <td style="text-align: right; padding: 5px 0;">${Number(tvq).toFixed(2)} $</td>
              </tr>
              <tr>
                <td style="padding: 10px 0 0 0; font-weight: bold; border-top: 1px solid #ccc; font-size: 1.1em;">Total payé :</td>
                <td style="text-align: right; padding: 10px 0 0 0; font-weight: bold; font-size: 1.1em; color: #2E7D32;">${Number(amount).toFixed(2)} $</td>
              </tr>
            </table>
          ` : `
            <p style="font-weight: bold; font-size: 1.1em; color: #2E7D32;">Total payé : ${Number(amount).toFixed(2)} $</p>
          `}
        </div>

        <p>Votre numéro de commande est : <strong>${orderNumber}</strong></p>
        ${receiptUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${receiptUrl}" style="background-color: #2C1810; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Voir le reçu officiel (Square)</a>
        </div>
        ` : ''}
        <p>Nous commencerons votre commande${pickupTime && pickupTime !== 'Dès que possible' ? ` pour ${pickupTime}` : ''}. Vous pouvez la récupérer en magasin au 1086 king ouest, Sherbrooke</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #666; text-align: center;">Café Namasthé - Éveillez vos sens.</p>
      </div>
    `
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur lors de l\'envoi du courriel Brevo:', errorData);
    } else {
      console.log(`Reçu envoyé par courriel à ${email}`);
    }
  } catch (error) {
    console.error('Erreur réseau lors de l\'envoi du courriel:', error);
  }
};

export const sendBirthdayEmail = async (email, name) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY non configurée. Envoi du courriel d\'anniversaire ignoré.');
    return { success: false, error: 'Clé manquante' };
  }

  const firstName = name ? name.split(' ')[0] : 'Cher(e) client(e)';

  const payload = {
    sender: { name: 'Café Namasthé', email: 'namasthesherbrooke@gmail.com' },
    to: [{ email: email, name: name || 'Client' }],
    subject: `🎉 Joyeux anniversaire ${firstName} ! Un cadeau vous attend au Café Namasthé ☕`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; text-align: center;">
        <h2 style="color: #E91E63;">Joyeux Anniversaire ${firstName} ! 🥳</h2>
        <p style="font-size: 1.1em; color: #5A4A42;">
          Toute l'équipe du Café Namasthé vous souhaite une journée remplie d'énergie tropicale !
        </p>
        <p style="font-size: 1.1em; color: #5A4A42;">
          Pour célébrer, nous voulons vous offrir une <strong>boisson gratuite</strong> de votre choix ! 🍹☕
        </p>
        
        <div style="background-color: #FCE4EC; padding: 15px; border-radius: 8px; margin: 30px 0; border: 2px dashed #E91E63;">
          <h3 style="margin-top: 0; color: #C2185B;">VOTRE CADEAU</h3>
          <p style="margin-bottom: 0; font-size: 1.2em; font-weight: bold; color: #2C1810;">1 Breuvage (16oz) au choix !*</p>
          <p style="margin-top: 8px; margin-bottom: 0; font-size: 0.85em; color: #C2185B;">*Les grandeurs extra et autres extras sont en sus.</p>
        </div>
        
        <p style="color: #666;">
          Venez nous voir en boutique d'ici les prochains jours et mentionnez que c'est votre anniversaire. Nous serons heureux de vous préparer votre boisson favorite.
        </p>
        
        <div style="background-color: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800; text-align: left;">
          <p style="margin: 0; color: #E65100; font-size: 1.05em;">
            <strong>👯‍♀️ Pssst... Ne venez pas seul !</strong><br>
            Amenez vos ami(e)s pour fêter avec vous et ils obtiendront <strong>10% de rabais</strong> sur leur commande !
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://cafenamasthesherbrooke.ca" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1em;">Visitez notre menu</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #666;">Café Namasthé - 1086 rue King O, Sherbrooke.</p>
      </div>
    `
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Brevo (Anniversaire):', errorData);
      return { success: false, error: errorData };
    }
    
    console.log(`Courriel d'anniversaire envoyé avec succès à ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur réseau (Anniversaire):', error);
    return { success: false, error: error.message };
  }
};
