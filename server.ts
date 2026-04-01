
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import CryptoJS from "crypto-js";
import axios from "axios";
import { initializeApp as initializeClientApp, getApp as getClientApp, getApps as getClientApps } from "firebase/app";
import { getFirestore as getClientFirestore, doc, getDoc, setDoc, getDocs, collection, query, where, limit, updateDoc, increment } from "firebase/firestore";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging setup
const logFile = "startup.log";
const log = (msg: string) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logFile, entry);
};

log("!!! SERVER STARTING !!!");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Log EVERY request immediately
  app.use((req, res, next) => {
    log(`[RAW REQUEST] ${req.method} ${req.url}`);
    next();
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
  });

  // Firebase Initialization
  let db: admin.firestore.Firestore;
  let clientDb: any;
  
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error("firebase-applet-config.json not found. Please run 'set_up_firebase' tool.");
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // Initialize Client SDK
    const clientApp = getClientApps().length === 0 
      ? initializeClientApp(firebaseConfig) 
      : getClientApp();
    clientDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId || "(default)");
    log(`Firebase Client SDK initialized with database: ${firebaseConfig.firestoreDatabaseId || "(default)"}`);

    // Initialize Admin SDK
    if (admin.apps.length === 0) {
      log(`Initializing Firebase Admin...`);
      try {
        // Try initializing without arguments first (ADC)
        admin.initializeApp();
        log("Firebase Admin initialized via ADC.");
      } catch (e: any) {
        log(`ADC initialization failed: ${e.message}. Falling back to projectId.`);
        admin.initializeApp({
          projectId: firebaseConfig.projectId
        });
        log(`Firebase Admin initialized with projectId: ${firebaseConfig.projectId}`);
      }
    }
    
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
    if (dbId !== "(default)" && dbId !== "") {
      db = admin.firestore(dbId);
    } else {
      db = admin.firestore();
    }
    log(`Firebase Admin SDK instance created. Project: ${admin.app().options.projectId || firebaseConfig.projectId}. Database: ${dbId}`);
    
    // Test read permission on startup
    (async () => {
      try {
        log("Testing Firestore read permission (CLIENT SDK) for system_metadata/duitku_configuration...");
        const testSnap = await getDoc(doc(clientDb, "system_metadata", "duitku_configuration"));
        log(`Startup test (CLIENT SDK): Firestore read successful. Exists: ${testSnap.exists()}`);
      } catch (err: any) {
        log(`Startup test (CLIENT SDK): Firestore read FAILED: ${err.message}`);
      }

      try {
        log("Testing Firestore read permission (ADMIN SDK) for system_metadata/duitku_configuration...");
        const testSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
        log(`Startup test (ADMIN SDK): Firestore read successful. Exists: ${testSnap.exists}`);
      } catch (err: any) {
        log(`Startup test (ADMIN SDK): Firestore read FAILED: ${err.message}`);
      }
    })();
  } catch (error: any) {
    log(`CRITICAL: Firebase initialization failed: ${error.message}`);
  }

  // --- DUITKU API ROUTES ---

  // Helper to get Firestore doc with fallback
  async function getFirestoreDoc(col: string, docId: string) {
    try {
      // Try Admin SDK first
      const snap = await db.collection(col).doc(docId).get();
      if (snap.exists) {
        return snap.data();
      }
    } catch (err: any) {
      log(`Admin SDK read error for ${col}/${docId}: ${err.message}`);
    }

    try {
      const clientSnap = await getDoc(doc(clientDb, col, docId));
      if (clientSnap.exists()) {
        return clientSnap.data();
      }
    } catch (err: any) {
      log(`Client SDK read error for ${col}/${docId}: ${err.message}`);
    }
    return null;
  }

  // Helper to set Firestore doc with fallback
  async function setFirestoreDoc(col: string, docId: string, data: any) {
    try {
      // Try Admin SDK first
      await db.collection(col).doc(docId).set(data, { merge: true });
      return true;
    } catch (err: any) {
      log(`Admin SDK write error for ${col}/${docId}: ${err.message}. Trying Client SDK...`);
    }

    try {
      await setDoc(doc(clientDb, col, docId), data, { merge: true });
      return true;
    } catch (err: any) {
      log(`Client SDK write error for ${col}/${docId}: ${err.message}`);
    }
    return false;
  }

  // Helper to get Firestore collection with fallback
  async function getFirestoreCollection(col: string) {
    try {
      // Try Admin SDK first
      const snap = await db.collection(col).get();
      return snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
    } catch (err: any) {
      log(`Admin SDK collection read error for ${col}: ${err.message}`);
    }

    try {
      const clientSnap = await getDocs(collection(clientDb, col));
      return clientSnap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
    } catch (err: any) {
      log(`Client SDK collection read error for ${col}: ${err.message}`);
    }
    return [];
  }

  // Helper to get Duitku config
  async function getDuitkuConfig() {
    return await getFirestoreDoc("system_metadata", "duitku_configuration");
  }

  // Debug route for GET
  app.get("/api/dk/test", (req, res) => {
    log("GET /api/dk/test called (unexpectedly)");
    res.json({ success: false, message: "Please use POST for this endpoint." });
  });

  app.post("/api/dk/test", async (req, res) => {
    try {
      log("POST /api/dk/test called");
      log("Testing Duitku connection...");
      
      let merchantCode, apiKey, environment;

      // Try to get config from body first (fallback if server can't read Firestore)
      if (req.body.merchantCode && req.body.apiKey) {
        log("Using config provided in request body.");
        merchantCode = req.body.merchantCode;
        apiKey = req.body.apiKey;
        environment = req.body.environment || 'sandbox';
      } else if (process.env.DUITKU_MERCHANT_CODE && process.env.DUITKU_API_KEY) {
        log("Using config provided in environment variables.");
        merchantCode = process.env.DUITKU_MERCHANT_CODE;
        apiKey = process.env.DUITKU_API_KEY;
        environment = process.env.DUITKU_ENVIRONMENT || 'sandbox';
      } else {
        if (!db && !clientDb) {
          log("CRITICAL: Firestore not initialized.");
          return res.status(500).json({ success: false, message: "Server Error: Database tidak terhubung." });
        }

        log(`Reading Firestore path: system_metadata/duitku_configuration`);
        const config = await getDuitkuConfig();
        if (config) {
          merchantCode = config.merchantCode;
          apiKey = config.apiKey;
          environment = config.environment;
        } else {
          return res.status(200).json({ 
            success: false, 
            message: "Konfigurasi belum disimpan di database. Silakan klik 'Simpan Konfigurasi' terlebih dahulu." 
          });
        }
      }

      // Trim credentials to avoid "Merchant not found" due to whitespace
      merchantCode = (merchantCode || "").toString().trim();
      apiKey = (apiKey || "").toString().trim();
      
      log(`[DUITKU DEBUG] Testing with Merchant: "${merchantCode}", Env: ${environment}`);
      log(`[DUITKU DEBUG] API Key length: ${apiKey.length}`);

      if (!merchantCode || !apiKey) {
        log("[DUITKU DEBUG] Missing credentials.");
        return res.status(200).json({ success: false, message: "Merchant Code atau API Key belum diisi." });
      }

      // Format datetime: YYYY-MM-DD HH:mm:ss (WIB - GMT+7)
      const now = new Date();
      // Adjust to WIB (GMT+7)
      const wibOffset = 7 * 60; // in minutes
      const localOffset = now.getTimezoneOffset(); // in minutes
      const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60000);
      
      const datetime = wibTime.getFullYear() + "-" + 
        String(wibTime.getMonth() + 1).padStart(2, '0') + "-" + 
        String(wibTime.getDate()).padStart(2, '0') + " " + 
        String(wibTime.getHours()).padStart(2, '0') + ":" + 
        String(wibTime.getMinutes()).padStart(2, '0') + ":" + 
        String(wibTime.getSeconds()).padStart(2, '0');

      const amount = 10000; // Test amount
      
      // Signature: sha256(merchantCode + amount + datetime + apiKey)
      const signaturePayload = merchantCode + String(amount) + datetime + apiKey;
      log(`[DUITKU DEBUG] Signature Payload: ${signaturePayload}`);
      const signature = CryptoJS.SHA256(signaturePayload).toString();
      log(`[DUITKU DEBUG] Generated Signature: ${signature}`);

      const url = environment === 'production' 
        ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      log(`[DUITKU DEBUG] Sending request to Duitku: ${url}`);
      log(`[DUITKU DEBUG] Body: ${JSON.stringify({ merchantcode: merchantCode, amount, datetime, signature })}`);

      const response = await axios.post(url, {
        merchantcode: merchantCode,
        amount,
        datetime,
        signature
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      log(`Duitku Response Status: ${response.status}`);
      const data = response.data;
      log(`Duitku Response Data: ${JSON.stringify(data)}`);

      if (data.responseCode === '00' || data.responseCode === '0' || (data.paymentFee && data.paymentFee.length > 0)) {
        res.json({ success: true, data });
      } else {
        res.json({ success: false, message: data.responseMessage || data.Message || "Gagal mendapatkan metode pembayaran.", data });
      }
    } catch (error: any) {
      log(`Error in /api/dk/test: ${error.message}`);
      if (error.response) {
        log(`Duitku Error Response: ${JSON.stringify(error.response.data)}`);
      }
      res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
  });

  // --- DUITKU TRANSACTION STATUS CHECK ---
  app.post("/api/dk/check-status", async (req, res) => {
    try {
      const { merchantOrderId } = req.body;
      log(`Checking Duitku status for Order: ${merchantOrderId}`);

      if (!merchantOrderId) {
        return res.status(400).json({ success: false, message: "Order ID diperlukan." });
      }

      const config = await getDuitkuConfig();
      if (!config) {
        return res.status(404).json({ success: false, message: "Konfigurasi Duitku tidak ditemukan." });
      }

      const { merchantCode, apiKey, environment } = config as any;

      // Signature for status check: md5(merchantCode + merchantOrderId + apiKey)
      const signature = CryptoJS.MD5(merchantCode + merchantOrderId + apiKey).toString();

      const url = environment === 'production'
        ? 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'
        : 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus';

      const response = await axios.post(url, {
        merchantCode,
        merchantOrderId,
        signature
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const data = response.data;
      log(`Duitku Status Response: ${JSON.stringify(data)}`);
      res.json({ success: true, data });
    } catch (error: any) {
      log(`Error in /api/dk/check-status: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/dk/methods", async (req, res) => {
    try {
      const { amount } = req.body;
      log(`Fetching payment methods for amount: ${amount}`);

      let merchantCode = process.env.DUITKU_MERCHANT_CODE;
      let apiKey = process.env.DUITKU_API_KEY;
      let environment = process.env.DUITKU_ENVIRONMENT || 'sandbox';

      if (!merchantCode || !apiKey) {
        if (!db) {
          return res.status(500).json({ responseMessage: "Database not initialized and env vars missing." });
        }
        const config = await getDuitkuConfig();
        if (!config) {
          return res.status(404).json({ responseMessage: "Duitku configuration not found in Firestore or Environment Variables" });
        }
        merchantCode = config.merchantCode;
        apiKey = config.apiKey;
        environment = config.environment || 'sandbox';
      }

      if (!merchantCode || !apiKey) {
        return res.status(400).json({ responseMessage: "Merchant Code or API Key is missing." });
      }
      
      // Format datetime: YYYY-MM-DD HH:mm:ss (WIB)
      const now = new Date();
      const wibOffset = 7 * 60;
      const localOffset = now.getTimezoneOffset();
      const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60000);

      const datetime = wibTime.getFullYear() + "-" + 
        String(wibTime.getMonth() + 1).padStart(2, '0') + "-" + 
        String(wibTime.getDate()).padStart(2, '0') + " " + 
        String(wibTime.getHours()).padStart(2, '0') + ":" + 
        String(wibTime.getMinutes()).padStart(2, '0') + ":" + 
        String(wibTime.getSeconds()).padStart(2, '0');

      // Signature menggunakan SHA256 sesuai dokumentasi terbaru Get Payment Method
      const signature = CryptoJS.SHA256(merchantCode + String(amount) + datetime + apiKey).toString();

      const url = environment === 'production' 
        ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      const response = await axios.post(url, {
        merchantcode: merchantCode,
        amount,
        datetime,
        signature
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const data = response.data;
      res.json(data);
    } catch (error: any) {
      log(`Error in /api/dk/methods: ${error.message}`);
      res.status(500).json({ responseMessage: error.message });
    }
  });

  app.post("/api/dk/inquiry", async (req, res) => {
    try {
      const { uid, planId, paymentMethod, email, customerName } = req.body;
      log(`Inquiry request: uid=${uid}, planId=${planId}, method=${paymentMethod}`);

      // Get Duitku Config
      const config = await getDuitkuConfig();
      if (!config) throw new Error("Duitku configuration not found");

      // Get Plan Details
      const catalogData = await getFirestoreDoc("system_metadata", "products_catalog");
      const catalog = catalogData?.list || [];
      const plan = catalog.find((p: any) => p.id === planId);

      if (!plan) throw new Error("Plan not found");

      const merchantCode = config.merchantCode;
      const apiKey = config.apiKey;
      const merchantOrderId = `TX-${Date.now()}-${uid.slice(-4)}`;
      const paymentAmount = Math.floor(plan.price);
      
      // Inquiry V2 signature: md5(merchantCode + merchantOrderId + paymentAmount + apiKey)
      const signature = CryptoJS.MD5(merchantCode + merchantOrderId + String(paymentAmount) + apiKey).toString();

      const callbackUrl = config.callbackUrl || `https://${req.get('host')}/api/dk/cb`;
      const returnUrl = config.returnUrl || `https://${req.get('host')}/`;

      const payload = {
        merchantCode,
        paymentAmount,
        merchantOrderId,
        productDetails: `Subscription ${plan.name}`,
        email,
        customerVaName: customerName,
        callbackUrl,
        returnUrl,
        signature,
        paymentMethod,
        expiryPeriod: 1440, // 24 hours
        itemDetails: [{
          name: `Subscription ${plan.name}`,
          price: paymentAmount,
          quantity: 1
        }],
        customerDetail: {
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phoneNumber: '081234567890', // Placeholder or get from user
          billingAddress: {
            firstName: customerName.split(' ')[0] || 'Customer',
            lastName: customerName.split(' ').slice(1).join(' ') || '',
            address: 'Jl. Sudirman',
            city: 'Jakarta',
            postalCode: '10000',
            phone: '081234567890',
            countryCode: 'ID'
          },
          shippingAddress: {
            firstName: customerName.split(' ')[0] || 'Customer',
            lastName: customerName.split(' ').slice(1).join(' ') || '',
            address: 'Jl. Sudirman',
            city: 'Jakarta',
            postalCode: '10000',
            phone: '081234567890',
            countryCode: 'ID'
          }
        }
      };

      const url = config.environment === 'production'
        ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
        : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry';

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const data = response.data;
      
      if (data.statusCode === '00') {
        // Save pending transaction to user
        const userData = await getFirestoreDoc("users", uid) as any;
        const manualTransactions = userData?.manualTransactions || [];
        
        manualTransactions.push({
          id: merchantOrderId,
          amount: paymentAmount,
          date: new Date().toISOString(),
          status: 'Pending',
          planTier: plan.tier,
          durationDays: plan.durationDays,
          paymentMethod: 'Duitku',
          reference: data.reference,
          checkoutUrl: data.paymentUrl
        });

        await setFirestoreDoc("users", uid, { manualTransactions });
      }

      res.json(data);
    } catch (error: any) {
      log(`Error in /api/dk/inquiry: ${error.message}`);
      res.status(500).json({ statusMessage: error.message });
    }
  });

  // Callback route
  app.all(["/cb", "/dk/cb", "/api/dk/cb"], async (req, res) => {
    try {
      log(`Duitku Callback received: ${JSON.stringify(req.body)}`);
      const { merchantCode, amount, merchantOrderId, signature, resultCode, reference } = req.body;

      const config = await getDuitkuConfig();
      if (!config) {
        log("Callback Error: Duitku configuration not found in database.");
        return res.status(404).json({ res: "ERROR", message: "Config not found" });
      }

      // Verify signature: md5(merchantCode + amount + merchantOrderId + apiKey)
      const calcSignature = CryptoJS.MD5(config.merchantCode + String(amount) + merchantOrderId + config.apiKey).toString();

      if (signature !== calcSignature) {
        log("Invalid signature in callback");
        return res.status(400).send("Invalid signature");
      }

      if (resultCode === '00') {
        log(`Payment SUCCESS for Order: ${merchantOrderId}`);
        
        const allUsers = await getFirestoreCollection("users");
        let targetUser: any = null;
        let targetUid: string = "";

        for (const user of allUsers) {
          const data = user as any;
          const tx = data.manualTransactions?.find((t: any) => t.id === merchantOrderId);
          if (tx) {
            targetUser = data;
            targetUid = data.id;
            break;
          }
        }

        if (targetUser && targetUid) {
          const txIndex = targetUser.manualTransactions.findIndex((t: any) => t.id === merchantOrderId);
          const tx = targetUser.manualTransactions[txIndex];
          
          if (tx.status !== 'Paid') {
            targetUser.manualTransactions[txIndex].status = 'Paid';
            targetUser.plan = tx.planTier;
            targetUser.status = 'Active';
            
            const now = new Date();
            const expiry = new Date();
            expiry.setDate(now.getDate() + (tx.durationDays || 30));
            targetUser.expiryDate = expiry.toISOString();
            targetUser.activeFrom = now.toISOString();

            await setFirestoreDoc("users", targetUid, targetUser);
            log(`Payment status updated for Order: ${merchantOrderId}`);
          }
        }
      } else {
        log(`Payment FAILED/PENDING for Order: ${merchantOrderId}, ResultCode: ${resultCode}`);
      }

      res.json({ res: "OK" });
    } catch (error: any) {
      log(`Error in callback: ${error.message}`);
      res.status(500).json({ res: "ERROR", message: error.message });
    }
  });

  app.post("/api/tracking/meta-capi", async (req, res) => {
    try {
      const { pixelId, accessToken, payload } = req.body;
      log(`Meta CAPI request for Pixel ID: ${pixelId}`);

      const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        log(`Meta CAPI error: ${JSON.stringify(data)}`);
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error: any) {
      log(`Error in /api/tracking/meta-capi: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for unhandled API routes
  app.use("/api", (req, res) => {
    log(`Unhandled API request: ${req.method} ${req.originalUrl || req.url}`);
    res.status(404).json({ 
      success: false, 
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
      hint: "Pastikan URL dan Method (GET/POST) sudah benar."
    });
  });

  // Debug endpoints
  app.get("/api/debug/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    log("Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Disable HMR as per guidelines
        host: "0.0.0.0",
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  log(`FATAL: Server failed to start: ${err.message}`);
});
