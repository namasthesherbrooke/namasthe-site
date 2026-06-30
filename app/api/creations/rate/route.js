import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const { id, rating, action } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "L'ID de la création est requis." }, { status: 400 });
    }

    // Vérification du cookie pour lire l'état actuel des votes
    const cookieStore = req.cookies;
    const ratedCookie = cookieStore.get('namasthe_rated');
    let ratedData = {};
    if (ratedCookie) {
      try {
        const parsed = JSON.parse(ratedCookie.value);
        if (Array.isArray(parsed)) {
          // Migration de l'ancien format (tableau d'IDs) vers le nouveau format (objet ID -> Note)
          parsed.forEach(vId => { ratedData[vId] = 5; }); // On assume 5 étoiles par défaut pour les anciens votes
        } else {
          ratedData = parsed;
        }
      } catch(e) {}
    }

    const hasVoted = id in ratedData;
    const previousRating = hasVoted ? ratedData[id] : 0;

    // 1. Récupérer la création actuelle pour connaître les totaux
    const { data: creation, error: fetchError } = await supabase
      .from('creations_clients')
      .select('rating_sum, rating_count')
      .eq('id', id)
      .single();

    if (fetchError || !creation) {
      console.error("Erreur de récupération pour le vote:", fetchError);
      return NextResponse.json({ error: "Création introuvable." }, { status: 404 });
    }

    const currentSum = creation.rating_sum || 0;
    const currentCount = creation.rating_count || 0;

    let newSum = currentSum;
    let newCount = currentCount;

    if (action === 'remove') {
      if (!hasVoted) {
        return NextResponse.json({ error: "Vous n'avez pas voté pour cette création." }, { status: 400 });
      }
      newSum -= previousRating;
      newCount -= 1;
      delete ratedData[id];
    } else {
      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Une note valide (1-5) est requise." }, { status: 400 });
      }
      if (hasVoted) {
        // Changement de vote
        newSum = newSum - previousRating + rating;
        ratedData[id] = rating;
      } else {
        // Nouveau vote
        newSum += rating;
        newCount += 1;
        ratedData[id] = rating;
      }
    }

    // Sécurité: Ne pas aller sous 0
    newSum = Math.max(0, newSum);
    newCount = Math.max(0, newCount);

    // 2. Mettre à jour avec la nouvelle note
    const { data: updatedData, error: updateError } = await supabase
      .from('creations_clients')
      .update({ 
        rating_sum: newSum,
        rating_count: newCount
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur d'enregistrement du vote:", updateError);
      return NextResponse.json({ error: "Impossible d'enregistrer le vote." }, { status: 500 });
    }

    // 3. Mettre à jour le cookie
    const response = NextResponse.json({ 
      success: true, 
      rating_sum: updatedData.rating_sum,
      rating_count: updatedData.rating_count
    });

    response.cookies.set({
      name: 'namasthe_rated',
      value: JSON.stringify(ratedData),
      maxAge: 60 * 60 * 24 * 365, // 1 an
      httpOnly: false,
      path: '/',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error("Erreur API POST rate:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
