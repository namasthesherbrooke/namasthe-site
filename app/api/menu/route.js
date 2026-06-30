import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!SUPA_URL || !SUPA_KEY) {
    return NextResponse.json({ success: false, error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY);

  try {
    const { data, error } = await supabase
      .from('square_cache')
      .select('catalog_data')
      .order('id', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, menu: { items: [], modifierLists: [], categories: [] } });
    }

    return NextResponse.json({ success: true, menu: data[0].catalog_data });
  } catch (error) {
    console.error("Menu fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
