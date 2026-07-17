import { createClient } from "@supabase/supabase-js";
import fs from "fs";
const envPath = ".env.local";
let envFile = fs.readFileSync(envPath, "utf8");
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/['"]/g, "").trim();
});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function test() {
  const { data: authData } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from("profiles").select("*").eq("newsletter", true);
  
  const mergedProfiles = profiles.map(p => {
    const user = authData.users.find(u => u.id === p.id);
    return { ...p, email: user ? user.email : null };
  }).filter(p => p.email);
  
  console.log("Total newsletter profiles:", profiles.length);
  console.log("Total with email:", mergedProfiles.length);
  const uniqueEmails = new Set(mergedProfiles.map(p => p.email.toLowerCase()));
  console.log("Unique emails:", uniqueEmails.size);
}
test();
