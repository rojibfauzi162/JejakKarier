
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import crypto from "crypto";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy-load Firestore Admin to prevent startup crashes
  let _db: any = null;
  const getDb = () => {
    if (_db) return _db;
    
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!getApps().length) {
        try {
          initializeApp(firebaseConfig);
        } catch (err) {
          console.error("[SERVER] Firebase Init Error:", err);
        }
      }
      try {
        _db = getFirestore(undefined, firebaseConfig.firestoreDatabaseId);
        return _db;
      } catch (err) {
        console.error("[SERVER] Firestore Access Error:", err);
        throw new Error("Database not initialized. Check Firebase configuration.");
      }
    } else {
      throw new Error("firebase-applet-config.json not found");
    }
  };

  // Helper MD5 Hashing
  const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Tracking Config Status (Separate endpoint for debugging)
  app.get("/api/debug/tracking-config", async (req, res) => {
    try {
      const db = getDb();
      const configSnap = await getDoc(doc(db, "system_metadata/tracking_configuration"));
      const config = configSnap.exists() ? configSnap.data()! : null;
      
      res.json({ 
        trackingConfig: config ? "FOUND" : "NOT FOUND"
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Duitku Config Status (Separate endpoint for debugging)
  app.get("/api/debug/duitku-config", async (req, res) => {
    try {
      const db = getDb();
      const configSnap = await getDoc(doc(db, "system_metadata/duitku_configuration"));
      const config = configSnap.exists() ? configSnap.data()! : null;
      
      res.json({ 
        duitkuConfig: config ? {
          merchantCode: config.merchantCode ? "SET" : "MISSING",
          apiKey: config.apiKey ? "SET" : "MISSING",
          environment: config.environment || "NOT SET"
        } : "NOT FOUND"
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Test Duitku Credentials
  app.post("/api/dk/test", async (req, res) => {
    try {
      const db = getDb();
      const configSnap = await getDoc(doc(db, "system_metadata/duitku_configuration"));
      if (!configSnap.exists()) return res.status(404).json({ message: "Config not found" });
      
      const config = configSnap.data()!;
      const merchantCode = String(config.merchantCode || "").trim();
      const apiKey = String(config.apiKey || "").trim();
      const env = config.environment || "sandbox";

      if (!merchantCode || !apiKey) return res.status(400).json({ message: "Merchant Code or API Key missing" });

      const now = new Date();
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(now.getTime() + wibOffset);
      const datetime = wibTime.toISOString().slice(0, 19).replace("T", " ");
      const amount = 10000;
      
      const sigBase = merchantCode + amount + datetime + apiKey;
      const signature = crypto.createHash("sha256").update(sigBase).digest("hex");

      const payload = {
        merchantcode: merchantCode,
        amount: amount,
        datetime: datetime,
        signature: signature,
      };

      const url = env === "production" 
        ? "https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod"
        : "https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod";

      console.log(`[SERVER] [DUITKU TEST] Testing ${env} with URL ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log(`[SERVER] [DUITKU TEST] Response:`, text);

      try {
        const data = JSON.parse(text);
        return res.json({ 
          success: response.ok && (data.responseCode === '00' || data.responseCode === '0'),
          data 
        });
      } catch (e) {
        return res.status(502).json({ message: "Invalid JSON from Duitku", raw: text.slice(0, 200) });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Duitku API Routes (Proxied logic from Cloud Functions)
  app.post("/api/dk/methods", async (req, res) => {
    const debugLog: string[] = [];
    debugLog.push("Request received");
    try {
      const { amount } = req.body;
      const db = getDb();
      debugLog.push("getDb called");
      const path = "system_metadata/duitku_configuration";
      debugLog.push(`Calling getDoc for ${path}`);
      const configSnap = await getDoc(doc(db, path));
      debugLog.push("getDoc successful");
      
      if (!configSnap.exists()) {
        console.warn("[SERVER] [DUITKU] Configuration missing in Firestore");
        return res.status(400).json({
          responseCode: "404",
          responseMessage: "Konfigurasi Duitku belum diatur di Admin Panel.",
        });
      }
      
      const config = configSnap.data();
      if (!config) {
        return res.status(400).json({
          responseCode: "400",
          responseMessage: "Data konfigurasi Duitku kosong.",
        });
      }

      const merchantCode = String(config.merchantCode || "").trim();
      const apiKey = String(config.apiKey || "").trim();
      
      if (!merchantCode || !apiKey) {
        console.warn("[SERVER] [DUITKU] Merchant Code or API Key is empty");
        return res.status(400).json({
          responseCode: "400",
          responseMessage: "Merchant Code atau API Key kosong di konfigurasi.",
        });
      }

      const intAmount = Math.floor(Number(amount || 0));
      if (isNaN(intAmount) || intAmount <= 0) {
        return res.status(400).json({
          responseCode: "400",
          responseMessage: "Jumlah pembayaran tidak valid.",
        });
      }

      // Use WIB (GMT+7) for datetime
      const now = new Date();
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(now.getTime() + wibOffset);
      const datetime = wibTime.toISOString().slice(0, 19).replace("T", " ");
      
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

      console.log(`[SERVER] [DUITKU] Fetching methods from ${url} with payload:`, JSON.stringify(payload));
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log(`[SERVER] [DUITKU] Raw Response from Duitku (${response.status}):`, text);

      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch (parseErr) {
        console.error("[SERVER] [DUITKU] Failed to parse Duitku response as JSON:", text);
        return res.status(502).json({ 
          responseCode: "502", 
          responseMessage: "Respon dari Duitku bukan JSON yang valid.",
          rawResponse: text.slice(0, 200)
        });
      }
    } catch (error: any) {
      console.error("[SERVER] getMethods Error:", error);
      return res.status(500).json({ 
        message: "Gagal mengambil metode pembayaran: " + error.message, 
        stack: error.stack,
        debugLog
      });
    }
  });

  app.post("/api/dk/inquiry", async (req, res) => {
    console.log("[SERVER] [DUITKU] Request to /api/dk/inquiry, body:", req.body);
    try {
      const { uid, planId, paymentMethod, email, customerName } = req.body;

      if (!uid || !planId) {
        console.warn("[SERVER] [DUITKU] Missing UID or PlanID");
        return res.status(400).json({ statusCode: "400", statusMessage: "UID dan Plan ID wajib diisi." });
      }

      const db = getDb();
      const [configSnap, catalogSnap] = await Promise.all([
        getDoc(doc(db, "system_metadata/duitku_configuration")),
        getDoc(doc(db, "system_metadata/products_catalog")),
      ]);

      if (!configSnap.exists()) {
        console.warn("[SERVER] [DUITKU] Configuration missing in Firestore");
        return res.status(400).json({ statusCode: "404", statusMessage: "Config Duitku belum disetel." });
      }
      
      const config = configSnap.data();
      if (!config) {
        return res.status(400).json({ statusCode: "400", statusMessage: "Data konfigurasi Duitku kosong." });
      }

      const merchantCode = String(config.merchantCode || "").trim();
      const apiKey = String(config.apiKey || "").trim();

      if (!merchantCode || !apiKey) {
        console.warn("[SERVER] [DUITKU] Merchant Code or API Key is empty");
        return res.status(400).json({ statusCode: "400", statusMessage: "Merchant Code atau API Key kosong." });
      }

      const catalogData = catalogSnap.exists() ? catalogSnap.data()! : { list: [] };
      const plans = catalogData.list || [];
      let plan = plans.find((p: any) => String(p.id) === String(planId));

      if (!plan && (planId === "Pro" || planId === "Free")) {
          plan = plans.find((p: any) => String(p.tier) === String(planId));
      }

      if (!plan) {
        console.warn("[SERVER] [DUITKU] Plan not found:", planId);
        return res.status(400).json({ statusCode: "404", statusMessage: "Paket tidak ditemukan di DB." });
      }

      const intAmount = Math.floor(Number(plan.price || 0));
      const orderId = "FK-" + Date.now();
      
      const signature = md5(merchantCode + orderId + intAmount + apiKey);

      // Construct callback URL dynamically if not set
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;
      const callbackUrl = config.callbackUrl || `${appUrl}/dk/cb`;
      const returnUrl = config.returnUrl || `${appUrl}/billing`;

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

      console.log(`[SERVER] [DUITKU] Sending Inquiry to ${url} with payload:`, JSON.stringify(payload));
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log(`[SERVER] [DUITKU] Raw Inquiry Response (${response.status}):`, text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("[SERVER] [DUITKU] Failed to parse Inquiry response as JSON:", text);
        return res.status(502).json({ 
          statusCode: "502", 
          statusMessage: "Respon dari Duitku bukan JSON yang valid.",
          rawResponse: text.slice(0, 200)
        });
      }
      
      if (data && data.statusCode === "00") {
        const db = getDb();
        const userRef = doc(db, `users/${uid}`);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data()!;
          const currentTxs = userData.manualTransactions || [];

          await updateDoc(userRef, {
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
    } catch (error: any) {
      console.error("[SERVER] FATAL Inquiry Error:", error);
      return res.status(500).json({
        statusCode: "500", 
        statusMessage: "Terjadi kesalahan internal pada server: " + error.message
      });
    }
  });

  // Alias for Duitku Callback (handles older or manual URLs)
  app.post(["/cb", "/dk/cb", "/api/cloud-functions/duitkuCallback"], async (req, res) => {
    try {
      let { amount, merchantOrderId, signature, resultCode, additionalParam } = req.body;
      
      console.log("[SERVER] [DUITKU CALLBACK] Received payload:", JSON.stringify(req.body));

      // Robustness: ensure amount is string for signature calculation
      amount = String(amount || "").trim();
      merchantOrderId = String(merchantOrderId || "").trim();
      signature = String(signature || "").trim();
      resultCode = String(resultCode || "").trim();
      additionalParam = String(additionalParam || "").trim();

      if (!merchantOrderId || !signature) {
        console.error("[SERVER] [DUITKU CALLBACK] Missing critical fields");
        return res.status(400).send("Missing fields");
      }

      const db = getDb();
      const configSnap = await getDoc(doc(db, "system_metadata/duitku_configuration"));
      if (!configSnap.exists()) {
        console.error("[SERVER] [DUITKU CALLBACK] Configuration missing in Firestore");
        return res.status(500).send("Configuration missing");
      }
      
      const config = configSnap.data()!;
      const merchantCode = String(config.merchantCode || "").trim();
      const apiKey = String(config.apiKey || "").trim();

      if (!merchantCode || !apiKey) {
        console.error("[SERVER] [DUITKU CALLBACK] Merchant Code or API Key missing in config");
        return res.status(500).send("Config incomplete");
      }

      const sigBase = merchantCode + amount + merchantOrderId + apiKey;
      const calcSignature = md5(sigBase);

      console.log(`[SERVER] [DUITKU CALLBACK] SigBase: ${sigBase}`);
      console.log(`[SERVER] [DUITKU CALLBACK] Calculated: ${calcSignature}, Received: ${signature}`);

      if (signature !== calcSignature) {
        console.error("[SERVER] [DUITKU CALLBACK] Invalid Signature mismatch");
        return res.status(400).send("Bad Signature");
      }

      if (resultCode === "00") {
        const userRef = doc(db, `users/${additionalParam}`);
        const userSnap = await getDoc(userRef);
        
        let userData: any = {};
        let transactions: any[] = [];
        let baseDate = new Date();

        if (userSnap.exists()) {
          userData = userSnap.data()!;
          transactions = userData.manualTransactions || [];
          if (userData.expiryDate && new Date(userData.expiryDate) > baseDate) {
            baseDate = new Date(userData.expiryDate);
          }
        } else {
          console.log("[SERVER] [DUITKU CALLBACK] User document not found, creating new one for UID:", additionalParam);
          userData = {
            uid: additionalParam,
            createdAt: new Date().toISOString(),
            role: "user"
          };
        }

        const txIndex = transactions.findIndex((t: any) => t.id === merchantOrderId);
        let durationDays = 30;
        let planTier = "Pro";

        if (txIndex > -1) {
          if (transactions[txIndex].status !== "Paid") {
            transactions[txIndex].status = "Paid";
            durationDays = transactions[txIndex].durationDays || 30;
            planTier = transactions[txIndex].planTier || "Pro";
          }
        } else {
          // If transaction not found in list, add it
          transactions.push({
            id: merchantOrderId,
            amount: amount,
            date: new Date().toISOString(),
            status: "Paid",
            planTier: "Pro",
            durationDays: 30,
            paymentMethod: "Duitku"
          });
        }

        const addedTime = durationDays * 24 * 60 * 60 * 1000;
        const newExpiry = new Date(baseDate.getTime() + addedTime);

        await setDoc(userRef, {
          ...userData,
          manualTransactions: transactions,
          plan: planTier,
          status: "Active",
          expiryDate: newExpiry.toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        console.log(`[SERVER] [DUITKU CALLBACK] SUCCESS: Account ${additionalParam} activated. New expiry: ${newExpiry.toISOString()}`);
      }
      return res.status(200).send("OK");
    } catch (error: any) {
      console.error("[SERVER] [DUITKU CALLBACK] FATAL ERROR:", error);
      return res.status(500).send("Internal Error");
    }
  });

  // Meta CAPI Proxy
  app.post("/api/tracking/meta-capi", async (req, res) => {
    const { pixelId, accessToken, payload } = req.body;

    if (!pixelId || !accessToken || !payload) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("[SERVER] Meta CAPI Error Response:", JSON.stringify(result));
        return res.status(response.status).json(result);
      }

      res.json(result);
    } catch (err) {
      console.error("[SERVER] Meta CAPI Network Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 404 Handler for API
  app.use("/api", (req, res) => {
    console.warn(`[SERVER] 404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: "API Route Not Found", path: req.originalUrl });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
