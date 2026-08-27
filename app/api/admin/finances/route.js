import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Vérification de sécurité spécifique pour les finances
function verifyFinancePin(req) {
  const pin = req.headers.get('x-finance-pin');
  // PIN de sécurité défini pour le module Finances
  const validPin = process.env.FINANCE_PIN || '2026';
  return pin === validPin;
}

export async function GET(req) {
  try {
    if (!verifyFinancePin(req)) {
      return NextResponse.json({ error: "Accès refusé. PIN incorrect." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const supabaseAdmin = getSupabaseAdmin();

    if (action === 'transactions') {
      const { data, error } = await supabaseAdmin
        .from('finances_transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return NextResponse.json({ success: true, transactions: data });
    }
    
    if (action === 'categories') {
      const { data, error } = await supabaseAdmin
        .from('finances_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return NextResponse.json({ success: true, categories: data });
    }

    if (action === 'balances') {
      const { data, error } = await supabaseAdmin
        .from('finances_balances')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return NextResponse.json({ success: true, balances: data });
    }

    if (action === 'patterns') {
      const { data, error } = await supabaseAdmin
        .from('finances_income_patterns')
        .select('*');
      
      if (error) throw error;
      return NextResponse.json({ success: true, patterns: data });
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("Erreur API Finances GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!verifyFinancePin(req)) {
      return NextResponse.json({ error: "Accès refusé. PIN incorrect." }, { status: 403 });
    }

    const body = await req.json();
    let action = body.action;
    const supabaseAdmin = getSupabaseAdmin();

    // Force add_transaction if the frontend sent an invalid ID (bypasses browser cache issues)
    if (action === 'update_transaction') {
      const { id } = body.data;
      if (!id || id === 'null' || String(id).startsWith('ghost-') || String(id).startsWith('sim-')) {
        action = 'add_transaction';
        body.data.id = undefined; // Remove the invalid ID so insert works
      }
    }

    if (action === 'add_transaction') {
      const { date, type, amount, category_id, description, entity, status = 'paid', priority = 2, is_fixed = false } = body.data;
      
      if (!date || !type || !amount || !category_id || !entity) {
        return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('finances_transactions')
        .insert([{
          date, type, amount: parseFloat(amount), category_id, description, entity, status, priority, is_fixed
        }])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, transaction: data[0] });
    }
    
    if (action === 'add_category') {
      const { name, type, entity, color } = body.data;
      
      const { data, error } = await supabaseAdmin
        .from('finances_categories')
        .insert([{ name, type, entity, color }])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, category: data[0] });
    }

    if (action === 'update_transaction') {
      const { id, updates } = body.data;
      
      const { data, error } = await supabaseAdmin
        .from('finances_transactions')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, transaction: data[0] });
    }

    if (action === 'add_balance') {
      const { account, date, amount } = body.data;
      
      const { data: existing } = await supabaseAdmin
        .from('finances_balances')
        .select('id')
        .eq('account', account)
        .eq('date', date)
        .maybeSingle();

      let resultData, error;
      if (existing) {
        const res = await supabaseAdmin
          .from('finances_balances')
          .update({ amount: parseFloat(amount) })
          .eq('id', existing.id)
          .select();
        resultData = res.data;
        error = res.error;
      } else {
        const res = await supabaseAdmin
          .from('finances_balances')
          .insert([{ account, date, amount: parseFloat(amount) }])
          .select();
        resultData = res.data;
        error = res.error;
      }

      if (error) throw error;
      return NextResponse.json({ success: true, balance: resultData[0] });
    }

    if (action === 'import_recurring') {
      const { transactions } = body.data;
      
      const { data, error } = await supabaseAdmin
        .from('finances_transactions')
        .insert(transactions)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, imported: data });
    }

    if (action === 'add_pattern') {
      const { entity, category_id, description, monday_amount, tuesday_amount, wednesday_amount, thursday_amount, friday_amount, saturday_amount, sunday_amount, is_monthly, monthly_day, monthly_amount } = body.data;
      
      const { data, error } = await supabaseAdmin
        .from('finances_income_patterns')
        .insert([{ entity, category_id, description, monday_amount, tuesday_amount, wednesday_amount, thursday_amount, friday_amount, saturday_amount, sunday_amount, is_monthly: is_monthly || false, monthly_day: monthly_day || null, monthly_amount: monthly_amount || 0 }])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, pattern: data[0] });
    }

    if (action === 'update_pattern') {
      const { id, entity, category_id, description, monday_amount, tuesday_amount, wednesday_amount, thursday_amount, friday_amount, saturday_amount, sunday_amount, is_monthly, monthly_day, monthly_amount } = body.data;
      
      const { data, error } = await supabaseAdmin
        .from('finances_income_patterns')
        .update({ entity, category_id, description, monday_amount, tuesday_amount, wednesday_amount, thursday_amount, friday_amount, saturday_amount, sunday_amount, is_monthly: is_monthly || false, monthly_day: monthly_day || null, monthly_amount: monthly_amount || 0 })
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, pattern: data[0] });
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("Erreur API Finances POST:", error);
    return NextResponse.json({ error: "Erreur serveur: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!verifyFinancePin(req)) {
      return NextResponse.json({ error: "Accès refusé. PIN incorrect." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const table = searchParams.get('table'); // finances_transactions, finances_categories, finances_income_patterns

    if (!id || !table) {
      return NextResponse.json({ error: "ID ou table manquant" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur API Finances DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
