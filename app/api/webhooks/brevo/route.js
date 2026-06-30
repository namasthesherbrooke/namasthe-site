import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const payload = await req.json();

    // Brevo envoie un événement "unsubscribe" lorsqu'un utilisateur clique sur le lien
    if (payload.event === 'unsubscribe' && payload.email) {
      
      // On appelle la fonction RPC pour désinscrire l'utilisateur via son email
      const { error } = await supabase.rpc('unsubscribe_user_by_email', {
        user_email: payload.email
      });

      if (error) {
        console.error("Erreur lors de la désinscription via Webhook:", error);
        return NextResponse.json({ error: "Erreur lors de la mise à jour de la base de données" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "Utilisateur désinscrit avec succès" });
    }

    return NextResponse.json({ success: true, message: "Événement ignoré" });
  } catch (error) {
    console.error("Erreur Webhook Brevo:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
