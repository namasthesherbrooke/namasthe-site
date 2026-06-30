import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, categories: data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: "Le nom de la catégorie est requis." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name: body.name, is_active: body.is_active !== undefined ? body.is_active : true }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error("Erreur POST /api/admin/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID de la catégorie est requis." }, { status: 400 });
    }

    const updates = {
      name: body.name,
      is_active: body.is_active
    };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error("Erreur PUT /api/admin/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: "L'ID de la catégorie est requis." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', body.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
