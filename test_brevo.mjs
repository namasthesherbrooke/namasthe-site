import fs from "fs";
import fetch from "node-fetch";
const envPath = ".env.local";
let envFile = fs.readFileSync(envPath, "utf8");
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/['"]/g, "").trim();
});
async function test() {
  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY },
    body: JSON.stringify({ email: "test@example.com", updateEnabled: true, listIds: [2] })
  });
  console.log(res.status, await res.text());
}
test();
