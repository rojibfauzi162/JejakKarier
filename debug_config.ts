
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function checkConfig() {
  const configPath = "./firebase-applet-config.json";
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found");
    return;
  }
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  // Initialize admin SDK
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    initializeApp();
  }

  const db = getFirestore(firebaseConfig.firestoreDatabaseId);
  const doc = await db.doc("system_metadata/duitku_configuration").get();
  if (doc.exists) {
    console.log("Duitku Config:", JSON.stringify(doc.data(), null, 2));
  } else {
    console.log("Duitku Config not found");
  }
}

checkConfig().catch(console.error);
