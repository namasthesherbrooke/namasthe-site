import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // Récupérer les créations, triées par la plus haute somme d'étoiles
    const { data, error } = await supabase
      .from('creations_clients')
      .select('*')
      .order('rating_sum', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erreur de récupération des créations:", error);
      return NextResponse.json({ error: "Impossible de récupérer les créations." }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, creations: data || [] },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'CDN-Cache-Control': 'no-store',
          'Cloudflare-CDN-Cache-Control': 'no-store',
        }
      }
    );
  } catch (error) {
    console.error("Erreur API GET creations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { nom_breuvage, createur, base, saveurs, recipe_data } = await req.json();

    if (!nom_breuvage || !createur || !base) {
      return NextResponse.json({ error: "Nom du breuvage, créateur et base sont requis." }, { status: 400 });
    }

    const payload = { 
      nom_breuvage, 
      createur, 
      base, 
      saveurs,
      rating_sum: 0,
      rating_count: 0
    };
    
    // Essayer d'insérer avec recipe_data en parsant le JSON si possible
    let parsedRecipeData = null;
    if (recipe_data) {
      try {
        parsedRecipeData = JSON.parse(recipe_data);
      } catch (e) {}
    }

    // Tentative 1 : avec recipe_data
    let { data, error } = await supabase
      .from('creations_clients')
      .insert([{ ...payload, recipe_data: parsedRecipeData || recipe_data }])
      .select()
      .single();

    if (error && error.code === 'PGRST204') { // Column does not exist
      console.warn("Colonne recipe_data inexistante. Insertion sans recipe_data.");
      // Tentative 2 : sans recipe_data (fallback)
      const fallbackResult = await supabase
        .from('creations_clients')
        .insert([payload])
        .select()
        .single();
        
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Erreur d'insertion de la création:", error);
      return NextResponse.json({ error: "Impossible de sauvegarder la création." }, { status: 500 });
    }

    return NextResponse.json({ success: true, creation: data });
  } catch (error) {
    console.error("Erreur API POST creations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const id = body.id;
    console.log("[DELETE] Requête reçue. Body:", JSON.stringify(body));
    console.log("[DELETE] ID à supprimer:", id);

    if (!id) {
      console.log("[DELETE] ERREUR: Pas d'ID fourni");
      return NextResponse.json({ error: "ID de la création requis." }, { status: 400 });
    }

    // Vérification de l'authentification Admin
    let isAdminAuthenticated = false;
    const authHeader = req.headers.get('Authorization');
    console.log("[DELETE] Auth header présent:", !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log("[DELETE] Token extrait (premiers 20 chars):", token.substring(0, 20));
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      console.log("[DELETE] Auth user:", user?.email, "Auth error:", authError?.message);
      if (user && user.email === 'namasthesherbrooke@gmail.com') {
        isAdminAuthenticated = true;
      }
    }

    if (!isAdminAuthenticated) {
      console.log("[DELETE] ACCÈS REFUSÉ - pas admin");
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    console.log("[DELETE] Admin vérifié. Création du client admin Supabase...");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("[DELETE] Service key présente:", !!supabaseServiceKey);
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

    // Vérifier que la recette existe avant de supprimer
    const { data: existing, error: findError } = await supabaseAdmin
      .from('creations_clients')
      .select('id, nom_breuvage')
      .eq('id', id)
      .single();
    console.log("[DELETE] Recette trouvée avant suppression:", JSON.stringify(existing), "Erreur:", findError?.message);

    // Supprimer avec .select() pour voir ce qui a été supprimé
    const { data: deleted, error } = await supabaseAdmin
      .from('creations_clients')
      .delete()
      .eq('id', id)
      .select();

    console.log("[DELETE] Résultat suppression - data:", JSON.stringify(deleted), "error:", error?.message);

    if (error) {
      console.error("[DELETE] ERREUR Supabase:", error);
      return NextResponse.json({ error: "Impossible de supprimer la création." }, { status: 500 });
    }

    if (!deleted || deleted.length === 0) {
      console.log("[DELETE] ATTENTION: Aucune ligne supprimée! RLS bloque probablement.");
      return NextResponse.json({ error: "La recette n'a pas pu être supprimée (aucune ligne affectée)." }, { status: 500 });
    }

    console.log("[DELETE] SUCCÈS - Recette supprimée:", deleted[0]?.nom_breuvage);
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("[DELETE] ERREUR EXCEPTION:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}
