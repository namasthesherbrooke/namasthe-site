import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, prenom, nom, date_naissance, action, telephone, preference_contact } = await req.json();

    if (!email || !action) {
      return NextResponse.json({ error: "L'email et l'action sont requis" }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = process.env.BREVO_LIST_ID ? parseInt(process.env.BREVO_LIST_ID) : 2; // Remplacez 2 par l'ID par défaut

    if (!apiKey) {
      console.warn("BREVO_API_KEY non configurée. Synchronisation ignorée.");
      return NextResponse.json({ success: true, message: "Mode démo : synchronisation ignorée" });
    }

    let payload = {
      email: email,
      updateEnabled: true, // Met à jour le contact s'il existe déjà
    };

    if (action === 'subscribe') {
      payload.listIds = [listId];
      payload.attributes = {
        PRENOM: prenom || "",
        NOM: nom || ""
      };
      if (date_naissance) {
        payload.attributes.DATE_NAISSANCE = date_naissance;
      }
      if (telephone) {
        // Nettoyage et formatage du numéro pour Brevo (exige le code pays)
        let cleanPhone = telephone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          cleanPhone = '+1' + cleanPhone;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
          cleanPhone = '+' + cleanPhone;
        } else if (!telephone.startsWith('+')) {
          cleanPhone = '+' + cleanPhone;
        } else {
          cleanPhone = telephone; // Si déjà formaté avec le + au début
        }
        
        payload.attributes.SMS = cleanPhone; // Attribut standard Brevo pour les numéros
        payload.attributes.TELEPHONE = cleanPhone;
      }
      if (preference_contact) {
        payload.attributes.PREF_CONTACT = preference_contact.toUpperCase();
      }
      // Si l'utilisateur se réinscrit, on s'assure qu'il n'est plus blacklisté
      payload.emailBlacklisted = false;
    } else if (action === 'unsubscribe') {
      // Pour désinscrire, on retire l'utilisateur de la liste
      payload.unlinkListIds = [listId];
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Brevo:", data);
      return NextResponse.json({ error: "Erreur lors de la synchronisation avec Brevo" }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur API Brevo:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
