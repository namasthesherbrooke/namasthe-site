import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://hpbavzawkozlcsnszlpr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwYmF2emF3a296bGNzbnN6bHByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MTg4MSwiZXhwIjoyMDk1MDQ3ODgxfQ.OFuNsYSiNFyYQLew4ZkhnqnTBFxc-i6JnaZcluIiOAY");
async function test() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log(data ? Object.keys(data[0]) : error);
}
test();
