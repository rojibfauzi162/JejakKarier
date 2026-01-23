
import { initializeApp } from "firebase/app";
// Use single quotes for consistent module resolution and fix naming resolution issues
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { AppData } from "../types";

// MASUKKAN CONFIG ANDA DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyCDvX0tJX24etCFWS9D-IG9B3_BV6xFGEk",
  authDomain: "jejakkarir-11379.firebaseapp.com",
  projectId: "jejakkarir-11379",
  storageBucket: "jejakkarir-11379.firebasestorage.app",
  messagingSenderId: "1099213790353",
  appId: "1:1099213790353:web:b675b4d7b955f91cd0b330",
  measurementId: "G-WKBT55412G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const saveUserData = async (uid: string, data: AppData) => {
  try {
    await setDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
  }
};

export const getUserData = async (uid: string): Promise<AppData | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as AppData;
  }
  return null;
};
