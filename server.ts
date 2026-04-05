
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import crypto from "crypto";
import axios from "axios";
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
  
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      throw new Error("firebase-applet-config.json not found. Please run 'set_up_firebase' tool.");
    }
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // Initialize Admin SDK
    const appName = "jejakkarir-admin";
    let adminApp;
    
    if (admin.apps.find(app => app?.name === appName)) {
      adminApp = admin.app(appName);
    } else {
      log(`Initializing Firebase Admin with name: ${appName}...`);
      try {
        adminApp = admin.initializeApp({
          projectId: firebaseConfig.projectId
        }, appName);
        log(`Firebase Admin initialized with projectId: ${firebaseConfig.projectId}`);
      } catch (e: any) {
        log(`Explicit initialization failed: ${e.message}. Trying default app.`);
        if (admin.apps.length === 0) {
          adminApp = admin.initializeApp();
        } else {
          adminApp = admin.app();
        }
      }
    }
    
    const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
    // Use the app instance to get firestore
    if (dbId !== "(default)" && dbId !== "") {
      db = adminApp.firestore(dbId);
    } else {
      db = adminApp.firestore();
    }
    log(`Firebase Admin SDK instance created. Project: ${adminApp.options.projectId || firebaseConfig.projectId}. Database: ${dbId}`);
    
    // Define Firestore Helper Functions (using Admin SDK)
    const getFirestoreDoc = async (collectionName: string, docId: string) => {
      if (!db) throw new Error("Firestore Admin SDK not initialized.");
      const docSnap = await db.collection(collectionName).doc(docId).get();
      return docSnap.exists ? docSnap.data() : null;
    };

    const setFirestoreDoc = async (collectionName: string, docId: string, data: any) => {
      if (!db) throw new Error("Firestore Admin SDK not initialized.");
      await db.collection(collectionName).doc(docId).set(data, { merge: true });
    };

    const getFirestoreCollection = async (collectionName: string) => {
      if (!db) throw new Error("Firestore Admin SDK not initialized.");
      const querySnapshot = await db.collection(collectionName).get();
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    };

    const getDuitkuConfig = async () => {
      return await getFirestoreDoc("system_metadata", "duitku_configuration");
    };

    // Test read permission on startup
    (async () => {
      await testConnectivity();
      try {
        log("Testing Firestore read permission (ADMIN SDK) for system_metadata/duitku_configuration...");
        const testSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
        log(`Startup test (ADMIN SDK): Firestore read successful. Exists: ${testSnap.exists}`);
      } catch (err: any) {
        log(`Startup test (ADMIN SDK): Firestore read FAILED: ${err.message}`);
        if (err.message.includes("Cloud Firestore API has not been used in project")) {
          log("HINT: This error suggests the Admin SDK is using the wrong project ID. Check firebase-applet-config.json.");
        }
      }
    })();
  } catch (error: any) {
    log(`CRITICAL: Firebase initialization failed: ${error.message}`);
  }

  // --- API ROUTES ---
  const apiRouter = express.Router();

  // Connectivity test helper
  async function testConnectivity() {
    try {
      log("Testing internet connectivity (fetching google.com)...");
      const resp = await axios.get("https://www.google.com", { timeout: 5000 });
      log(`Connectivity test: SUCCESS. Status: ${resp.status}`);
    } catch (err: any) {
      log(`Connectivity test: FAILED. Error: ${err.message}`);
    }
  }

  // Debug route for GET
  apiRouter.get("/dk/test", (req, res) => {
    log("GET /api/dk/test called");
    res.json({ success: false, message: "Please use POST for this endpoint. Server is alive." });
  });

  apiRouter.get("/ping", (req, res) => {
    log("GET /api/ping called");
    res.json({ pong: true, time: new Date().toISOString() });
  });

  apiRouter.post("/dk/test", async (req, res) => {
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
        if (!db) {
          log("CRITICAL: Firestore Admin SDK not initialized.");
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

      const amountStr = amount.toString();
      
      // Signature: sha256(merchantCode + amount + datetime + apiKey)
      const signaturePayload = merchantCode + amountStr + datetime + apiKey;
      log(`[DUITKU DEBUG] Signature Payload: ${signaturePayload}`);
      const signature = crypto.createHash('sha256').update(signaturePayload).digest('hex');
      log(`[DUITKU DEBUG] Generated Signature: ${signature}`);

      const url = environment === 'production' 
        ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      log(`[DUITKU DEBUG] Sending request to Duitku: ${url}`);
      const requestBody = {
        merchantcode: merchantCode,
        amount: amountStr,
        datetime,
        signature
      };
      log(`[DUITKU DEBUG] Body: ${JSON.stringify(requestBody)}`);

      const response = await axios.post(url, requestBody, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
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
  apiRouter.post("/dk/check-status", async (req, res) => {
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
      const signature = crypto.createHash('md5').update(merchantCode + merchantOrderId + apiKey).digest('hex');

      const url = environment === 'production'
        ? 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'
        : 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'; // Sandbox URL is often the same or similar

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

  apiRouter.post("/dk/methods", async (req, res) => {
    try {
      const { amount } = req.body;
      log(`Fetching payment methods for amount: ${amount}`);

      let merchantCode = process.env.DUITKU_MERCHANT_CODE;
      let apiKey = process.env.DUITKU_API_KEY;
      let environment = process.env.DUITKU_ENVIRONMENT || 'sandbox';

      if (!merchantCode || !apiKey) {
        const config = await getDuitkuConfig();
        if (!config) {
          return res.status(404).json({ responseMessage: "Duitku configuration not found" });
        }
        merchantCode = config.merchantCode;
        apiKey = config.apiKey;
        environment = config.environment || 'sandbox';
      }

      if (!merchantCode || !apiKey) {
        return res.status(400).json({ responseMessage: "Merchant Code or API Key is missing." });
      }
      
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

      const signature = crypto.createHash('sha256').update(merchantCode + String(amount) + datetime + apiKey).digest('hex');

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

  apiRouter.post("/dk/inquiry", async (req, res) => {
    try {
      const { uid, planId, paymentMethod, email, customerName } = req.body;
      log(`Inquiry request: uid=${uid}, planId=${planId}, method=${paymentMethod}`);

      const config = await getDuitkuConfig();
      if (!config) throw new Error("Duitku configuration not found");

      const catalogData = await getFirestoreDoc("system_metadata", "products_catalog");
      const catalog = catalogData?.list || [];
      const plan = catalog.find((p: any) => p.id === planId);

      if (!plan) throw new Error("Plan not found");

      const merchantCode = config.merchantCode;
      const apiKey = config.apiKey;
      const merchantOrderId = `TX-${Date.now()}-${uid.slice(-4)}`;
      const paymentAmount = Math.floor(plan.price);
      
      const signature = crypto.createHash('md5').update(merchantCode + merchantOrderId + String(paymentAmount) + apiKey).digest('hex');

      // const callbackUrl = config.callbackUrl || `https://${req.get('host')}/api/dk/cb`;
      const callbackUrl = config.callbackUrl || `${process.env.API_BASE_URL || 'https://api.fokuskarir.web.id'}/api/dk/cb`;
      const returnUrl   = config.returnUrl   || `${process.env.FRONTEND_URL || 'https://fokuskarir.web.id'}/payment/success`;
      // const returnUrl = config.returnUrl || `https://${req.get('host')}/`;

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
        expiryPeriod: 1440,
        itemDetails: [{
          name: `Subscription ${plan.name}`,
          price: paymentAmount,
          quantity: 1
        }],
        customerDetail: {
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || '',
          email: email,
          phoneNumber: '081234567890',
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

  apiRouter.post("/tracking/meta-capi", async (req, res) => {
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

  // Mount API router
  app.use("/api", apiRouter);

  // Callback route (outside /api if needed, but we also have it in /api/dk/cb)
  // app.all(["/cb", "/dk/cb", "/api/dk/cb"], async (req, res) => {
  app.post("/api/dk/cb", async (req, res) => {
    try {
      log(`Duitku Callback received: ${JSON.stringify(req.body)}`);
      const { merchantCode, amount, merchantOrderId, signature, resultCode, reference } = req.body;

      const config = await getDuitkuConfig();
      if (!config) {
        log("Callback Error: Duitku configuration not found in database.");
        return res.status(404).json({ res: "ERROR", message: "Config not found" });
      }

      const calcSignature = crypto.createHash('md5').update(config.merchantCode + String(amount) + merchantOrderId + config.apiKey).digest('hex');

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
      // res.status(500).json({ res: "ERROR", message: error.message });
      res.status(200).json({ res: "OK" }); // Selalu 200 agar Duitku tidak retry
    }
  });

  // Catch-all for unhandled API routes
  app.use("/api", (req, res) => {
    log(`Unhandled API request: ${req.method} ${req.originalUrl || req.url}`);
    log(`Headers: ${JSON.stringify(req.headers)}`);
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
