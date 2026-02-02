
import { initializeApp } from "firebase/app";
import { getAuth } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc, increment, query, where, limit } from "firebase/firestore";
import { AppData, AiConfig, SubscriptionProduct, AccountStatus, SubscriptionPlan, ScalevConfig } from "../types";

// KONFIGURASI FIREBASE
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

/* 
  ========================================================================
  SALIN ATURAN BERIKUT KE FIREBASE CONSOLE > FIRESTORE > RULES
  ========================================================================
  
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Aturan untuk data user
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
      }
      
      // Aturan untuk metadata sistem (OpenRouter Key, Katalog Produk)
      match /system_metadata/{document} {
        // Penting: Izinkan semua user login baca metadata agar AI bisa jalan
        allow read: if request.auth != null;
        // Hanya Superadmin yang bisa ubah settingan
        allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
      }
    }
  }
  ========================================================================
*/

export const saveUserData = async (uid: string, data: AppData) => {
  try {
    await setDoc(doc(db, "users", uid), {
      ...data,
      uid,
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
    if (!uid) throw new Error("Valid UID required");
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

export const recordAiTokens = async (uid: string, count: number) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (!userData.aiUsage) {
        await updateDoc(userRef, {
          aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: count },
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(userRef, {
          "aiUsage.totalTokens": increment(count),
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error("Error recording tokens:", error);
  }
};

export const getAiConfig = async (): Promise<AiConfig | null> => {
  try {
    // Gunakan timeout singkat untuk pengecekan config agar UI tidak hang
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AiConfig;
    }
  } catch (error: any) {
    // Silent fail jika permission denied, biarkan service AI menggunakan fallback
    if (error.code === 'permission-denied') {
      console.warn("[FIREBASE] Akses config AI diblokir Rules. Pastikan rules system_metadata diizinkan untuk read.");
    } else {
      console.error("[FIREBASE] Gagal ambil config AI:", error.message);
    }
  }
  return null;
};

export const saveAiConfig = async (config: AiConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const dataToSave = {
      openRouterKey: config.openRouterKey || "",
      modelName: config.modelName || "google/gemini-2.0-flash-exp:free",
      maxTokens: Math.min(Number(config.maxTokens) || 4096, 8192), // Safety cap
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving AI config:", error);
    throw error;
  }
};

export const getScalevConfig = async (): Promise<ScalevConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "scalev_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as ScalevConfig;
  } catch (e) {
    console.error("Error fetching Scalev config:", e);
  }
  return null;
};

export const saveScalevConfig = async (config: ScalevConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "scalev_configuration");
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving Scalev config:", error);
    throw error;
  }
};

export const getProductsCatalog = async (): Promise<SubscriptionProduct[] | null> => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list;
  } catch (e) {
    console.error("Error fetching products:", e);
  }
  return null;
};

export const saveProductsCatalog = async (products: SubscriptionProduct[]) => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    await setDoc(docRef, { list: products, updatedAt: new Date().toISOString() });
  } catch (e) {
    throw e;
  }
};

/**
 * MOCKUP BACKEND LOGIC (Hanya berjalan di Server/Cloud Functions)
 * Fungsi ini digunakan untuk memproses Webhook dari Scalev
 */
export const processScalevOrder = async (email: string, scalevProdId: string) => {
  // 1. Cari Paket yang sesuai dengan ID Produk Scalev
  const catalog = await getProductsCatalog();
  const matchedPlan = catalog?.find(p => p.scalevProductId === scalevProdId);
  
  if (!matchedPlan) {
    console.error("Order Gagal: ID Produk Scalev tidak dikenali di sistem JejakKarir.");
    return;
  }

  // 2. Cari User berdasarkan Email
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("profile.email", "==", email), limit(1));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    console.warn("User belum terdaftar. Menyiapkan record pre-purchase...");
    // Bisa tambahkan logic untuk simpan email agar saat daftar nanti otomatis aktif
    return;
  }

  const userDoc = querySnap.docs[0];
  const userRef = doc(db, "users", userDoc.id);

  // 3. Hitung Masa Aktif
  const now = new Date();
  const expiry = new Date();
  expiry.setDate(now.getDate() + matchedPlan.durationDays);

  // 4. Update Akun User
  await updateDoc(userRef, {
    plan: matchedPlan.tier,
    status: AccountStatus.ACTIVE,
    activeFrom: now.toISOString(),
    expiryDate: expiry.toISOString(),
    planPermissions: matchedPlan.allowedModules,
    planLimits: matchedPlan.limits,
    updatedAt: new Date().toISOString()
  });

  console.log(`Berhasil mengaktifkan paket ${matchedPlan.name} untuk user ${email}`);
};
