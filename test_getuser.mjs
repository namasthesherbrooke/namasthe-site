import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xyz.supabase.co', 'eyJhbGci');
async function test() {
  try {
    const res = await supabase.auth.getUser("null");
    console.log(res);
  } catch (e) {
    console.error("CAUGHT EXCEPTION:", e.message);
  }
}
test();
