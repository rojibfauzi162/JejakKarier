
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

async function testClient() {
  const configPath = "./firebase-applet-config.json";
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  
  const app = initializeApp(firebaseConfig);
  const dbId = firebaseConfig.firestoreDatabaseId;
  const db = getFirestore(app, dbId !== "(default)" && dbId !== "" ? dbId : undefined);

  try {
    console.log("Testing client SDK access to system_metadata/duitku_configuration...");
    const docRef = doc(db, "system_metadata", "duitku_configuration");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log("Success! Data:", snap.data());
    } else {
      console.log("Document does not exist, but access was granted.");
    }
  } catch (error: any) {
    console.error("Client SDK Error:", error.message || error);
  }
}

testClient().catch(console.error);
