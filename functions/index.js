
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Helper MD5 Hashing
const md5 = (str) => crypto.createHash("md5").update(str).digest("hex");

/**
 * ENDPOINT 1: Ambil Metode Pembayaran
 */
app.post("/getMethods", async (req, res) => {
  try {
    const {amount} = req.body;
    const configSnap = await db.doc("system_metadata/duitku_configuration").get();
    
    if (!configSnap.exists) {
      return res.status(400).json({
        responseCode: "404",
        responseMessage: "Konfigurasi Duitku belum diatur di Admin Panel.",
      });
    }
    
    const config = configSnap.data();
    const merchantCode = String(config.merchantCode).trim();
    const apiKey = String(config.apiKey).trim();
    
    const intAmount = parseInt(amount);
    const datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    
    // Signature getPaymentMethod: sha256(merchantCode + amount + datetime + apiKey)
    const sigBase = merchantCode + intAmount + datetime + apiKey;
    const signature = crypto.createHash("sha256").update(sigBase).digest("hex");

    const payload = {
      merchantcode: merchantCode,
      amount: intAmount,
      datetime: datetime,
      signature: signature,
    };

    const prodUrl = "https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod";
    const sandUrl = "https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod";

    const url = config.environment === "production" ? prodUrl : sandUrl;

    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("getMethods Error:", error);
    return res.status(500).json({message: "Gagal mengambil metode pembayaran: " + error.message});
  }
});

/**
 * ENDPOINT 2: Buat Transaksi (Inquiry V2)
 */
app.post("/createInquiry", async (req, res) => {
  try {
    const {uid, planId, paymentMethod, email, customerName} = req.body;

    if (!uid || !planId) {
      return res.status(400).json({statusCode: "400", statusMessage: "UID dan Plan ID wajib diisi."});
    }

    // 1. Ambil Config & Catalog
    const [configSnap, catalogSnap] = await Promise.all([
      db.doc("system_metadata/duitku_configuration").get(),
      db.doc("system_metadata/products_catalog").get(),
    ]);

    if (!configSnap.exists) {
      return res.status(400).json({statusCode: "404", statusMessage: "Config Duitku belum disetel."});
    }
    
    const config = configSnap.data();
    const merchantCode = String(config.merchantCode).trim();
    const apiKey = String(config.apiKey).trim();

    const catalogData = catalogSnap.exists ? catalogSnap.data() : {list: []};
    const plans = catalogData.list || [];
    let plan = plans.find((p) => String(p.id) === String(planId));

    if (!plan && (planId === "Pro" || planId === "Free")) {
        plan = plans.find((p) => String(p.tier) === String(planId));
    }

    if (!plan) {
      return res.status(400).json({statusCode: "404", statusMessage: "Paket tidak ditemukan di DB."});
    }

    // 2. Setup Data Transaksi
    const intAmount = Math.floor(Number(plan.price));
    const orderId = "FK-" + Date.now();
    
    // SIGNATURE INQUIRY V2: md5(merchantCode + merchantOrderId + paymentAmount + apiKey)
    const signature = md5(merchantCode + orderId + intAmount + apiKey);

    const region = "us-central1";
    const projectId = process.env.GCP_PROJECT || "jejakkarir-11379";
    const callbackUrl = config.callbackUrl || `https://${region}-${projectId}.cloudfunctions.net/duitkuCallback`;
    const returnUrl = config.returnUrl || "https://fokuskarir.web.id/billing";

    const payload = {
      merchantCode: merchantCode,
      paymentAmount: intAmount,
      paymentMethod: paymentMethod,
      merchantOrderId: orderId,
      productDetails: "Berlangganan " + plan.name,
      email: email || "customer@mail.com",
      customerVaName: customerName || "Customer FokusKarir",
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      expiryPeriod: 60,
      additionalParam: uid,
      signature: signature,
    };

    const prodInq = "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
    const sandInq = "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";
    const url = config.environment === "production" ? prodInq : sandInq;

    console.log(`[DUITKU] Sending Payload to ${config.environment}:`, JSON.stringify(payload));

    // 3. Request ke Duitku
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // CRITICAL LOGGING: Lihat apa alasan Duitku menolak transaksi ini
    console.log(`[DUITKU] Response Code: ${response.status}`);
    console.log(`[DUITKU] Response Body:`, JSON.stringify(data));

    // 4. Jika Sukses, Simpan ke History User sebagai 'Pending'
    if (data && data.statusCode === "00") {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        const currentTxs = userData.manualTransactions || [];

        await userRef.update({
          manualTransactions: [...currentTxs, {
            id: orderId,
            amount: intAmount,
            date: new Date().toISOString(),
            status: "Pending",
            planTier: plan.tier,
            durationDays: plan.durationDays || 30,
            paymentMethod: "Duitku",
            reference: data.reference || "",
            checkoutUrl: data.paymentUrl || ""
          }],
          updatedAt: new Date().toISOString()
        });
      }
    }

    return res.json(data);
  } catch (error) {
    console.error("FATAL Inquiry Error:", error);
    return res.status(500).json({
      statusCode: "500", 
      statusMessage: "Terjadi kesalahan internal pada server: " + error.message
    });
  }
});

// Export Express App
exports.api = functions.https.onRequest(app);

/**
 * ENDPOINT 3: Callback Handler
 */
exports.duitkuCallback = functions.https.onRequest(async (req, res) => {
  try {
    const {amount, merchantOrderId, signature, resultCode, additionalParam} = req.body;
    
    console.log("[DUITKU CALLBACK] Received payload:", req.body);

    const configSnap = await db.doc("system_metadata/duitku_configuration").get();
    if (!configSnap.exists) return res.status(500).send("Configuration missing");
    
    const config = configSnap.data();
    const merchantCode = String(config.merchantCode).trim();
    const apiKey = String(config.apiKey).trim();

    // Signature Callback: md5(merchantCode + amount + merchantOrderId + apiKey)
    const sigBase = merchantCode + amount + merchantOrderId + apiKey;
    const calcSignature = md5(sigBase);

    if (signature !== calcSignature) {
      console.error("[DUITKU CALLBACK] Invalid Signature mismatch");
      return res.status(400).send("Bad Signature");
    }

    if (resultCode === "00") {
      const userRef = db.collection("users").doc(additionalParam);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        let transactions = userData.manualTransactions || [];

        const txIndex = transactions.findIndex((t) => t.id === merchantOrderId);
        if (txIndex > -1 && transactions[txIndex].status !== "Paid") {
          transactions[txIndex].status = "Paid";

          const days = transactions[txIndex].durationDays || 30;
          let baseDate = new Date();
          if (userData.expiryDate && new Date(userData.expiryDate) > baseDate) {
            baseDate = new Date(userData.expiryDate);
          }

          const addedTime = days * 24 * 60 * 60 * 1000;
          const newExpiry = new Date(baseDate.getTime() + addedTime);

          await userRef.update({
            manualTransactions: transactions,
            plan: transactions[txIndex].planTier,
            status: "Active",
            expiryDate: newExpiry.toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`[DUITKU CALLBACK] SUCCESS: Account ${additionalParam} activated.`);
        }
      }
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[DUITKU CALLBACK] FATAL ERROR:", error);
    return res.status(500).send("Internal Error");
  }
});
