import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'namasthesherbrooke@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'NamastheAdmin!'
  });
  
  if (error) {
    console.error("SignIn error:", error);
    return;
  }
  
  const token = data.session.access_token;
  console.log("Got token.");
  
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError) {
    console.error("getUser error:", userError);
  } else {
    console.log("getUser success:", userData.user.email);
  }
}
test();
