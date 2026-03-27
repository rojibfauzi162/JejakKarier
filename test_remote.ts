
import fetch from "node-fetch";

async function testLocal() {
  const url = "https://ais-dev-tb6oefqv2vrpr2jp3gdoal-86548481689.asia-southeast1.run.app/api/dk/methods";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10000 })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

testLocal();
