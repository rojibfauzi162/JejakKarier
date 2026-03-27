
import fetch from "node-fetch";
import crypto from "crypto";

async function testDuitkuProd() {
  const merchantCode = "D11379"; // Example or from user config
  const apiKey = "your_api_key"; // Need real one to be sure, but let's test the endpoint
  const amount = 10000;
  const datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const sigBase = merchantCode + amount + datetime + apiKey;
  const signature = crypto.createHash("sha256").update(sigBase).digest("hex");

  const payload = {
    merchantcode: merchantCode,
    amount: amount,
    datetime: datetime,
    signature: signature,
  };

  const url = "https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod";
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

testDuitkuProd();
