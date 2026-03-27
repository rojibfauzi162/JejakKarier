
import fetch from "node-fetch";

async function testLocal() {
  try {
    const res = await fetch("http://localhost:3000/api/debug/duitku-config");
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testLocal();
