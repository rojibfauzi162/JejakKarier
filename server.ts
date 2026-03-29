
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
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
      log(`Firebase Admin initialized for project: ${firebaseConfig.projectId}`);
    }
    db = admin.firestore();
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
        db = admin.firestore(firebaseConfig.firestoreDatabaseId);
    }
    log("Firestore Admin connected.");
  } catch (error: any) {
    log(`CRITICAL: Firebase Admin initialization failed: ${error.message}`);
  }

  // --- DUITKU API ROUTES ---

  app.post("/api/dk/methods", async (req, res) => {
    try {
      const { amount } = req.body;
      log(`Fetching payment methods for amount: ${amount}`);

      const configSnap = await db.collection("system_metadata").doc("duitku_configuration").get();
      if (!configSnap.exists) {
        return res.status(404).json({ responseMessage: "Duitku configuration not found in Firestore" });
      }
      const config = configSnap.data() as any;

      const merchantCode = config.merchantCode;
      const apiKey = config.apiKey;
      const datetime = new Date().toISOString();
      const signature = CryptoJS.MD5(merchantCode + amount + datetime + apiKey).toString();

      const url = config.environment === 'production' 
        ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCode,
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
      
      const signature = CryptoJS.MD5(merchantCode + merchantOrderId + paymentAmount + apiKey).toString();

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
        expiryPeriod: 1440 // 24 hours
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

      // Verify signature
      const calcSignature = CryptoJS.MD5(config.merchantCode + amount + merchantOrderId + config.apiKey).toString();

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
