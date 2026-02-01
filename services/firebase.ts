
import { initializeApp } from "firebase/app";
// Use @firebase/auth to ensure named exports like getAuth are correctly resolved in modular Firebase v9+ environments
import { getAuth } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc, increment } from "firebase/firestore";
import { AppData, AiConfig } from "../types";

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
      uid, // Pastikan UID tersimpan di doc
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

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<AppData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as AppData),
      uid: doc.id
    }));
  } catch (error: any) {
    console.error("Admin: Error fetching all users:", error);
    throw error;
  }
};

export const updateAdminMetadata = async (uid: string, fields: Partial<AppData>) => {
  try {
    if (!uid || typeof uid !== 'string') {
      throw new Error("Valid UID is required for updating metadata");
    }
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...fields,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Admin: Error updating user metadata:", error);
    throw error;
  }
};

export const logAIUsage = async (uid: string, type: 'cvGenerated' | 'coverLetters' | 'careerAnalysis') => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as AppData;
      const currentUsage = data.aiUsage || { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 };
      await updateDoc(userRef, {
        [`aiUsage.${type}`]: (currentUsage[type] || 0) + 1,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error logging AI usage:", error);
  }
};

export const recordAiTokens = async (uid: string, count: number) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      "aiUsage.totalTokens": increment(count),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error recording tokens:", error);
  }
};

export const getAiConfig = async (): Promise<AiConfig | null> => {
  try {
    // Menggunakan koleksi system_metadata agar tidak berbenturan dengan rules users
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AiConfig;
    }
  } catch (error: any) {
    // Jika error permission, return null secara diam-diam untuk regular user
    if (error.code !== 'permission-denied') {
      console.error("Error fetching AI config:", error);
    }
  }
  return null;
};

export const saveAiConfig = async (config: AiConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "ai_configuration");
    // Eksplisit mapping untuk menghindari error tipe data atau undefined di Firestore
    const dataToSave = {
      openRouterKey: config.openRouterKey || "",
      modelName: config.modelName || "google/gemini-2.0-flash-exp:free",
      maxTokens: Number(config.maxTokens) || 2000,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving AI config:", error);
    throw error;
  }
};

// --- PRODUCT CATALOG PERSISTENCE ---

export const getProductsCatalog = async (): Promise<any[] | null> => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list;
  } catch (e) {
    console.error("Error fetching products:", e);
  }
  return null;
};

export const saveProductsCatalog = async (products: any[]) => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    await setDoc(docRef, { list: products, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Error saving products:", e);
    throw e;
  }
};
