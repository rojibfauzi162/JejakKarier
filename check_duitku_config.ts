
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

async function checkConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found");
    return;
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  }

  const db = admin.firestore();
  const configSnap = await db.doc("system_metadata/duitku_configuration").get();

  if (!configSnap.exists) {
    console.error("Duitku configuration NOT FOUND in Firestore at system_metadata/duitku_configuration");
  } else {
    const data = configSnap.data();
    console.log("Duitku Config Found:");
    console.log("Merchant Code:", data?.merchantCode ? "SET" : "MISSING");
    console.log("API Key:", data?.apiKey ? "SET" : "MISSING");
    console.log("Environment:", data?.environment);
  }
}

checkConfig().catch(console.error);
