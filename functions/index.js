
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
      console.error("Duitku Config not found in Firestore");
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
      amount: amount,
      datetime: datetime,
      signature: signature,
    };

    const prodUrl = "https://passport.duitku.com/webapi/api/merchant/" +
      "paymentmethod/getpaymentmethod";
    const sandUrl = "https://sandbox.duitku.com/webapi/api/merchant/" +
      "paymentmethod/getpaymentmethod";

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
    return res.status(500).json({message: error.message});
  }
});

/**
 * ENDPOINT 2: Buat Transaksi (Inquiry V2)
 */
app.post("/createInquiry", async (req, res) => {
  try {
    const {uid, planId, paymentMethod, email, customerName} = req.body;

    // 1. Ambil Config & Catalog
    const configSnap = await db.doc("system_metadata/duitku_configuration").get();
    const catalogSnap = await db.doc("system_metadata/products_catalog").get();

    if (!configSnap.exists) {
      return res.status(400).json({statusCode: "404", statusMessage: "Config Duitku belum disetel di Admin."});
    }
    if (!catalogSnap.exists) {
      return res.status(400).json({statusCode: "404", statusMessage: "Katalog produk belum disetel di Admin."});
    }

    const config = configSnap.data();
    const catalogData = catalogSnap.data();
    const plan = (catalogData.list || []).find((p) => p.id === planId);

    if (!plan) {
      return res.status(400).json({statusCode: "404", statusMessage: "Paket tidak ditemukan dalam katalog."});
    }

    // 2. Setup Data Transaksi
    const orderId = "FK-" + Date.now();
    const amount = Math.floor(plan.price);
    
    // SIGNATURE INQUIRY V2: md5(merchantcode + merchantOrderId + paymentAmount + apiKey)
    const signature = md5(config.merchantCode + orderId + amount + config.apiKey);

    const region = "us-central1";
    const projectId = process.env.GCP_PROJECT || "jejakkarir-11379";
    const fallbackCallback = `https://${region}-${projectId}.cloudfunctions.net/duitkuCallback`;
    
    const callbackUrl = config.callbackUrl || fallbackCallback;
    const returnUrl = config.returnUrl || "https://fokuskarir.web.id/billing";

    const payload = {
      merchantCode: config.merchantCode,
      paymentAmount: amount,
      paymentMethod: paymentMethod,
      merchantOrderId: orderId,
      productDetails: "Premium - " + plan.name,
      email: email,
      customerVaName: customerName,
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      expiryPeriod: 60,
      additionalParam: uid,
      signature: signature,
    };

    const prodInq = "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";
    const sandInq = "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry";
    const url = config.environment === "production" ? prodInq : sandInq;

    // 3. Request ke Duitku
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // 4. Jika Sukses, Simpan ke History User sebagai 'Pending'
    if (data.statusCode === "00") {
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
            durationDays: plan.durationDays,
            paymentMethod: "Duitku",
            reference: data.reference,
            checkoutUrl: data.paymentUrl
          }],
          updatedAt: new Date().toISOString()
        });
      }
    }

    return res.json(data);
  } catch (error) {
    console.error("FATAL Inquiry Error:", error);
    return res.status(500).json({statusCode: "500", statusMessage: "Internal Server Error: " + error.message});
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
    
    console.log("[DUITKU CALLBACK] Body:", req.body);

    const configSnap = await db.doc("system_metadata/duitku_configuration").get();
    if (!configSnap.exists) return res.status(500).send("Config missing");
    
    const config = configSnap.data();

    // Verify Callback Signature: md5(merchantCode + amount + merchantOrderId + apiKey)
    const sigBase = config.merchantCode + amount + merchantOrderId + config.apiKey;
    const calcSignature = md5(sigBase);

    if (signature !== calcSignature) {
      console.error("[DUITKU CALLBACK] Invalid Signature");
      return res.status(400).send("Invalid Signature");
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
          // Jika masih berlangganan, tambahkan dari tanggal expired lama
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
          console.log(`[DUITKU CALLBACK] SUCCESS: User ${additionalParam} activated.`);
        }
      }
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[DUITKU CALLBACK] ERROR:", error);
    return res.status(500).send("Internal Server Error");
  }
});
