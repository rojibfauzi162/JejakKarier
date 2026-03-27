
import fetch from "node-fetch";

async function testMethods() {
  try {
    console.log("Testing /api/dk/methods...");
    const res = await fetch("http://localhost:3000/api/dk/methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10000 })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

testMethods();
