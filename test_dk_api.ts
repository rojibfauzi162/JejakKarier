import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/dk/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode: "DXXXX",
      apiKey: "DXXXXCX80TZJ85Q70QCI",
      isProduction: false
    })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
