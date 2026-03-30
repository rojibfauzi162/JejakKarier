
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";
import CryptoJS from "crypto-js";

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
    console.log(`[RAW REQUEST] ${req.method} ${req.url}`);
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

  // Firebase Admin Initialization
  let db: admin.firestore.Firestore;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    if (!admin.apps.length) {
      const projectId = firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT;
      
      // Try to initialize with default credentials first
      try {
        admin.initializeApp();
        log(`Firebase Admin initialized with default credentials.`);
      } catch (e) {
        log(`Default initialization failed, trying with projectId: ${projectId}`);
        admin.initializeApp({
          projectId: projectId
        });
        log(`Firebase Admin initialized with projectId: ${projectId}`);
      }
      
      if (projectId) {
        process.env.GOOGLE_CLOUD_PROJECT = projectId;
      }
    }
    
    // Use the specific database ID if provided, otherwise default
    const dbId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') 
      ? firebaseConfig.firestoreDatabaseId 
      : undefined;
      
    db = admin.firestore(dbId);
    log(`Firestore Admin connected. Database: ${dbId || 'default'}.`);
  } catch (error: any) {
    log(`CRITICAL: Firebase Admin initialization failed: ${error.message}`);
  }

  // --- DUITKU API ROUTES ---

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
        if (!db) {
          log("CRITICAL: Firestore Admin not initialized.");
          return res.status(500).json({ success: false, message: "Server Error: Database tidak terhubung." });
        }

        log(`Reading Firestore path: system_metadata/duitku_configuration`);
        let configSnap;
        try {
          configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
          if (configSnap.exists) {
            const config = configSnap.data() as any;
            merchantCode = config.merchantCode;
            apiKey = config.apiKey;
            environment = config.environment;
          } else {
            return res.status(200).json({ 
              success: false, 
              message: "Konfigurasi belum disimpan di database. Silakan klik 'Simpan Konfigurasi' terlebih dahulu." 
            });
          }
        } catch (err: any) {
          log(`ERROR reading Firestore: ${err.message}`);
          return res.status(500).json({ 
            success: false, 
            message: `Server Error: ${err.message}. Silakan coba simpan konfigurasi terlebih dahulu.` 
          });
        }
      }

      if (!merchantCode || !apiKey) {
        return res.status(200).json({ success: false, message: "Merchant Code atau API Key belum diisi." });
      }

      // Format datetime: YYYY-MM-DD HH:mm:ss (WIB - GMT+7)
      const now = new Date();
      // Adjust to WIB (GMT+7)
      const wibOffset = 7 * 60; // in minutes
      const localOffset = now.getTimezoneOffset(); // in minutes (usually 0 in this env)
      const wibTime = new Date(now.getTime() + (wibOffset + localOffset) * 60000);
      
      const datetime = wibTime.getFullYear() + "-" + 
        String(wibTime.getMonth() + 1).padStart(2, '0') + "-" + 
        String(wibTime.getDate()).padStart(2, '0') + " " + 
        String(wibTime.getHours()).padStart(2, '0') + ":" + 
        String(wibTime.getMinutes()).padStart(2, '0') + ":" + 
        String(wibTime.getSeconds()).padStart(2, '0');

      const amount = 10000; // Test amount
      // Signature: sha256(merchantCode + amount + datetime + apiKey)
      const signature = CryptoJS.SHA256(merchantCode + String(amount) + datetime + apiKey).toString();

      const url = environment === 'production' 
        ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      log(`Sending request to Duitku: ${url}`);
      log(`Params: merchantcode=${merchantCode}, amount=${amount}, datetime=${datetime}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          merchantcode: merchantCode,
          amount,
          datetime,
          signature
        })
      });

      const responseText = await response.text();
      log(`Duitku Raw Response: ${responseText}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        log(`Failed to parse Duitku response as JSON: ${responseText}`);
        return res.status(200).json({ success: false, message: `Duitku API Error: Respons bukan JSON. (${response.status})` });
      }

      if (data.responseCode === '00' || data.responseCode === '0' || (data.paymentFee && data.paymentFee.length > 0)) {
        res.json({ success: true, data });
      } else {
        res.json({ success: false, message: data.responseMessage || data.Message || "Gagal mendapatkan metode pembayaran.", data });
      }
    } catch (error: any) {
      log(`Error in /api/dk/test: ${error.message}`);
      if (error.stack) log(`Stack: ${error.stack}`);
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

      const configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
      if (!configSnap.exists) {
        return res.status(404).json({ success: false, message: "Konfigurasi Duitku tidak ditemukan." });
      }

      const config = configSnap.data() as any;
      const { merchantCode, apiKey, environment } = config;

      // Signature for status check: md5(merchantCode + merchantOrderId + apiKey)
      const signature = CryptoJS.MD5(merchantCode + merchantOrderId + apiKey).toString();

      const url = environment === 'production'
        ? 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'
        : 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCode,
          merchantOrderId,
          signature
        })
      });

      const data = await response.json();
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
        const configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
        if (!configSnap.exists) {
          return res.status(404).json({ responseMessage: "Duitku configuration not found in Firestore or Environment Variables" });
        }
        const config = configSnap.data() as any;
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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantcode: merchantCode,
          amount,
          datetime,
          signature
        })
      });

      const data = await response.json();
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
      const configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
      const config = configSnap.data() as any;

      // Get Plan Details
      const catalogSnap = await db.collection("system_metadata").doc("products_catalog").get();
      const catalog = catalogSnap.data()?.list || [];
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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.statusCode === '00') {
        // Save pending transaction to user
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        const userData = userSnap.data();
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

        await userRef.update({ manualTransactions });
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

      const configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
      const config = configSnap.data() as any;

      // Verify signature: md5(merchantCode + amount + merchantOrderId + apiKey)
      const calcSignature = CryptoJS.MD5(config.merchantCode + String(amount) + merchantOrderId + config.apiKey).toString();

      if (signature !== calcSignature) {
        log("Invalid signature in callback");
        return res.status(400).send("Invalid signature");
      }

      if (resultCode === '00') {
        log(`Payment SUCCESS for Order: ${merchantOrderId}`);
        
        // Find user by orderId
        const usersSnap = await db.collection("users").where("manualTransactions", "array-contains-any", [{ id: merchantOrderId }]).get();
        
        // Wait, array-contains-any with objects is tricky. Let's find manually if needed or use a better query.
        // For simplicity in this environment, we might need to search.
        // But usually, the orderId contains the UID or we can store it in a separate collection.
        
        // Let's try a simpler approach: find the user whose manualTransactions has this ID.
        // In a real app, we'd have a 'transactions' collection.
        
        const allUsers = await db.collection("users").get();
        let targetUser: any = null;
        let targetUid: string = "";

        for (const doc of allUsers.docs) {
          const data = doc.data();
          const tx = data.manualTransactions?.find((t: any) => t.id === merchantOrderId);
          if (tx) {
            targetUser = data;
            targetUid = doc.id;
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

            await db.collection("users").doc(targetUid).set(targetUser);
            log(`User ${targetUid} upgraded to ${tx.planTier}`);
          }
        }
      }

      res.status(200).send("OK");
    } catch (error: any) {
      log(`Error in callback: ${error.message}`);
      res.status(500).send(error.message);
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
  app.all("/api/*all", (req, res) => {
    log(`Unhandled API request: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.url}` });
  });

  // Debug endpoints
  app.get("/api/debug/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    log("Initializing Vite middleware...");
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
