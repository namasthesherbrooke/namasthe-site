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
      .from('ingredients')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, ingredients: data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/ingredients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validation de base
    if (!body.name || !body.type) {
      return NextResponse.json({ error: "Le nom et le type sont requis." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .insert([
        {
          name: body.name,
          type: body.type,
          price_impact: body.price_impact !== undefined ? parseFloat(body.price_impact) : 0.00,
          is_active: body.is_active !== undefined ? body.is_active : true
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ingredient: data });
  } catch (error) {
    console.error("Erreur POST /api/admin/ingredients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID de l'ingrédient est requis." }, { status: 400 });
    }

    const updates = {
      name: body.name,
      type: body.type,
      price_impact: body.price_impact !== undefined ? parseFloat(body.price_impact) : undefined,
      is_active: body.is_active
    };

    // Retirer les clés non définies
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabaseAdmin
      .from('ingredients')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ingredient: data });
  } catch (error) {
    console.error("Erreur PUT /api/admin/ingredients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID de l'ingrédient est requis." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('ingredients')
      .delete()
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/ingredients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
