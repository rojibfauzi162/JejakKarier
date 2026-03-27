
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

async function listAll() {
  const configPath = "./firebase-applet-config.json";
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  initializeApp({
    projectId: firebaseConfig.projectId,
  });

  const dbDefault = getFirestore();
  const collectionsDefault = await dbDefault.listCollections();
  console.log("Default Collections:", collectionsDefault.map(c => c.id));
}

listAll().catch(console.error);
