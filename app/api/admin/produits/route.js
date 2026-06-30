import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Utiliser la clé Service Role pour ignorer les RLS lors des opérations admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, products: data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/produits:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validation de base
    if (!body.name || !body.category || body.base_price === undefined) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          name: body.name,
          description: body.description || null,
          category: body.category,
          base_price: parseFloat(body.base_price),
          image_url: body.image_url || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          allowed_ingredients: body.allowed_ingredients || []
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    console.error("Erreur POST /api/admin/produits:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID du produit est requis." }, { status: 400 });
    }

    const updates = {
      name: body.name,
      description: body.description,
      category: body.category,
      base_price: body.base_price !== undefined ? parseFloat(body.base_price) : undefined,
      image_url: body.image_url,
      is_active: body.is_active,
      allowed_ingredients: body.allowed_ingredients
    };

    // Retirer les clés non définies
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: data });
  } catch (error) {
    console.error("Erreur PUT /api/admin/produits:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID du produit est requis." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/produits:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
