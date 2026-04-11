import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json"));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-6a779293-e299-40fc-91bc-96bed2cfa8e3");
console.log("DB initialized with ai-studio-6a779293-e299-40fc-91bc-96bed2cfa8e3");

async function test() {
  try {
    await getDoc(doc(db, "system_metadata", "duitku_configuration"));
    console.log("Fetch success");
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}
test();
