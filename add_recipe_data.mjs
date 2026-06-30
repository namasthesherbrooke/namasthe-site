import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const sbUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const sbKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(sbUrl, sbKey);

async function addColumn() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS recipe_data JSONB;"
  });
  
  if (error) {
    console.error("Error executing SQL:", error.message);
    // If execute_sql is not available or fails, we might just query the database via postgres driver, but supabase REST API doesn't support ALTER TABLE directly. 
    // Wait, the project has sql query helper. Let's see if it works.
  } else {
    console.log("Column recipe_data added!");
  }
}

addColumn();
