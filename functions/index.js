
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
    const datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
    const sigBase = config.merchantCode + amount + datetime + config.apiKey;
    const signature = crypto.createHash("sha256").update(sigBase).digest("hex");

    const payload = {
      merchantcode: config.merchantCode,
      amount: parseInt(amount),
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
      return res.status(400).json({statusCode: "404", statusMessage: "Config Duitku belum disetel di Admin."});
    }
    
    const config = configSnap.data();
    const catalogData = catalogSnap.exists ? catalogSnap.data() : {list: []};
    const plan = (catalogData.list || []).find((p) => p.id === planId);

    if (!plan) {
      return res.status(400).json({statusCode: "404", statusMessage: "Paket tidak ditemukan dalam katalog database."});
    }

    // 2. Setup Data Transaksi
    const orderId = "FK-" + Date.now();
    const amount = Math.floor(Number(plan.price));
    
    // SIGNATURE INQUIRY V2: md5(merchantcode + merchantOrderId + paymentAmount + apiKey)
    const signature = md5(config.merchantCode + orderId + amount + config.apiKey);

    const region = "us-central1";
    const projectId = process.env.GCP_PROJECT || "jejakkarir-11379";
    const fallbackCallback = `https://${region}-${projectId}.cloudfunctions.net/duitkuCallback`;
    
    const callbackUrl = config.callbackUrl || fallbackCallback;
    const returnUrl = config.returnUrl || "https://fokuskarir.web.id/billing";

    // ITEM DETAILS: WAJIB ADA AGAR MUNCUL DI DAFTAR TRANSAKSI DUITKU
    const itemDetails = [
      {
        name: "Layanan FokusKarir - " + plan.name,
        price: amount,
        quantity: 1
      }
    ];

    const payload = {
      merchantCode: config.merchantCode,
      paymentAmount: amount,
      paymentMethod: paymentMethod,
      merchantOrderId: orderId,
      productDetails: "Premium - " + plan.name,
      additionalParam: uid, // UID disimpan di sini untuk callback
      email: email || "customer@mail.com",
      customerVaName: customerName || "Customer FokusKarir",
      itemDetails: itemDetails, // Tambahkan detail item
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      expiryPeriod: 60,
      signature: signature,
    };

    console.log("[DUITKU PAYLOAD DEBUG]:", JSON.stringify(payload));

    const prodInq = "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
    const sandInq = "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";
    const url = config.environment === "production" ? prodInq : sandInq;

    // 3. Request ke Duitku
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[DUITKU ERROR] Respon bukan JSON:", responseText);
      return res.status(502).json({
        statusCode: "502",
        statusMessage: "Duitku Gateway Error (Respon tidak valid).",
      });
    }

    // 4. Simpan ke database jika Inquiry sukses
    if (data && data.statusCode === "00") {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        const currentTxs = userData.manualTransactions || [];

        await userRef.update({
          manualTransactions: [...currentTxs, {
            id: orderId,
            amount: amount,
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
      statusMessage: "Terjadi kesalahan internal: " + error.message
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
    
    console.log("[DUITKU CALLBACK RECEIVED]:", JSON.stringify(req.body));

    const configSnap = await db.doc("system_metadata/duitku_configuration").get();
    if (!configSnap.exists) return res.status(500).send("Configuration missing");
    
    const config = configSnap.data();
    // Signature Callback: md5(merchantCode + amount + merchantOrderId + apiKey)
    const sigBase = config.merchantCode + amount + merchantOrderId + config.apiKey;
    const calcSignature = md5(sigBase);

    if (signature !== calcSignature) {
      console.error("[DUITKU CALLBACK] Signature Mismatch!");
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
