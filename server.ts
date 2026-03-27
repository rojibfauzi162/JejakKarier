
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import crypto from "crypto";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy-load Firestore to prevent startup crashes
  let _db: admin.firestore.Firestore | null = null;
  const getDb = () => {
    if (_db) return _db;
    
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (!admin.apps.length) {
        try {
          admin.initializeApp({
            projectId: firebaseConfig.projectId
          });
        } catch (err) {
          console.error("[SERVER] Firebase Admin Init Error:", err);
        }
      }
    } else {
      if (!admin.apps.length) {
        try {
          admin.initializeApp();
        } catch (err) {
          console.error("[SERVER] Firebase Admin Init Error (Default):", err);
        }
      }
    }
    
    try {
      _db = admin.firestore();
      return _db;
    } catch (err) {
      console.error("[SERVER] Firestore Access Error:", err);
      throw new Error("Database not initialized. Check Firebase configuration.");
    }
  };

  // Helper MD5 Hashing
  const md5 = (str: string) => crypto.createHash("md5").update(str).digest("hex");

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Duitku API Routes (Proxied logic from Cloud Functions)
  app.post("/api/cloud-functions/getMethods", async (req, res) => {
    try {
      const { amount } = req.body;
      const db = getDb();
      const configSnap = await db.doc("system_metadata/duitku_configuration").get();
      
      if (!configSnap.exists) {
        return res.status(400).json({
          responseCode: "404",
          responseMessage: "Konfigurasi Duitku belum diatur di Admin Panel.",
        });
      }
      
      const config = configSnap.data()!;
      const merchantCode = String(config.merchantCode).trim();
      const apiKey = String(config.apiKey).trim();
      
      const intAmount = parseInt(amount);
      const datetime = new Date().toISOString().slice(0, 19).replace("T", " ");
      
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("[SERVER] getMethods Error:", error);
      return res.status(500).json({ message: "Gagal mengambil metode pembayaran: " + error.message });
    }
  });

  app.post("/api/cloud-functions/createInquiry", async (req, res) => {
    try {
      const { uid, planId, paymentMethod, email, customerName } = req.body;

      if (!uid || !planId) {
        return res.status(400).json({ statusCode: "400", statusMessage: "UID dan Plan ID wajib diisi." });
      }

      const db = getDb();
      const [configSnap, catalogSnap] = await Promise.all([
        db.doc("system_metadata/duitku_configuration").get(),
        db.doc("system_metadata/products_catalog").get(),
      ]);

      if (!configSnap.exists) {
        return res.status(400).json({ statusCode: "404", statusMessage: "Config Duitku belum disetel." });
      }
      
      const config = configSnap.data()!;
      const merchantCode = String(config.merchantCode).trim();
      const apiKey = String(config.apiKey).trim();

      const catalogData = catalogSnap.exists ? catalogSnap.data()! : { list: [] };
      const plans = catalogData.list || [];
      let plan = plans.find((p: any) => String(p.id) === String(planId));

      if (!plan && (planId === "Pro" || planId === "Free")) {
          plan = plans.find((p: any) => String(p.tier) === String(planId));
      }

      if (!plan) {
        return res.status(400).json({ statusCode: "404", statusMessage: "Paket tidak ditemukan di DB." });
      }

      const intAmount = Math.floor(Number(plan.price));
      const orderId = "FK-" + Date.now();
      
      const signature = md5(merchantCode + orderId + intAmount + apiKey);

      // Construct callback URL dynamically if not set
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const appUrl = process.env.APP_URL || `${protocol}://${host}`;
      const callbackUrl = config.callbackUrl || `${appUrl}/api/cloud-functions/duitkuCallback`;
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

      console.log(`[SERVER] [DUITKU] Sending Payload to ${config.environment}:`, JSON.stringify(payload));

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      console.log(`[SERVER] [DUITKU] Response Code: ${response.status}`);
      console.log(`[SERVER] [DUITKU] Response Body:`, JSON.stringify(data));

      if (data && data.statusCode === "00") {
        const db = getDb();
        const userRef = db.collection("users").doc(uid);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          const userData = userSnap.data()!;
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
    } catch (error: any) {
      console.error("[SERVER] FATAL Inquiry Error:", error);
      return res.status(500).json({
        statusCode: "500", 
        statusMessage: "Terjadi kesalahan internal pada server: " + error.message
      });
    }
  });

  app.post("/api/cloud-functions/duitkuCallback", async (req, res) => {
    try {
      const { amount, merchantOrderId, signature, resultCode, additionalParam } = req.body;
      
      console.log("[SERVER] [DUITKU CALLBACK] Received payload:", req.body);

      const db = getDb();
      const configSnap = await db.doc("system_metadata/duitku_configuration").get();
      if (!configSnap.exists) return res.status(500).send("Configuration missing");
      
      const config = configSnap.data()!;
      const merchantCode = String(config.merchantCode).trim();
      const apiKey = String(config.apiKey).trim();

      const sigBase = merchantCode + amount + merchantOrderId + apiKey;
      const calcSignature = md5(sigBase);

      if (signature !== calcSignature) {
        console.error("[SERVER] [DUITKU CALLBACK] Invalid Signature mismatch");
        return res.status(400).send("Bad Signature");
      }

      if (resultCode === "00") {
        const userRef = db.collection("users").doc(additionalParam);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          const userData = userSnap.data()!;
          let transactions = userData.manualTransactions || [];

          const txIndex = transactions.findIndex((t: any) => t.id === merchantOrderId);
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
            console.log(`[SERVER] [DUITKU CALLBACK] SUCCESS: Account ${additionalParam} activated.`);
          }
        }
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
