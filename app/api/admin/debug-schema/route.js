import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { data: tables } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  const { data: cols } = await supabase.from('information_schema.columns').select('column_name').eq('table_name', 'profiles');
  return NextResponse.json({ tables, cols });
}
