import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-6a779293-e299-40fc-91bc-96bed2cfa8e3");
console.log("DB initialized with ai-studio-6a779293-e299-40fc-91bc-96bed2cfa8e3");

async function test() {
  try {
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    await setDoc(docRef, {
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      logoDarkUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Logo updated successfully");
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}
test();
