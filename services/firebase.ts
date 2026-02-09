
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, increment, query, where, limit } from "firebase/firestore";
import { AppData, AiConfig, SubscriptionProduct, AccountStatus, MayarConfig, LegalConfig, UserRole, LandingPageConfig } from "../types";

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

// Provider Google Auth
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Utility to recursively remove undefined values from an object.
 * Firestore does not support 'undefined' values.
 */
const sanitizeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item));
  } else if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        sanitized[key] = sanitizeData(obj[key]);
      }
    });
    return sanitized;
  }
  return obj;
};

/**
 * Fungsi Login/Register dengan Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const saveUserData = async (uid: string, data: AppData) => {
  try {
    const sanitized = sanitizeData({
      ...data,
      uid,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, "users", uid), sanitized, { merge: true });
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
    if (error.code === 'permission-denied') {
      return [];
    }
    console.error("Admin: Error fetching all users:", error);
    throw error;
  }
};

export const updateAdminMetadata = async (uid: string, fields: Partial<AppData>) => {
  try {
    if (!uid) throw new Error("Valid UID required");
    const userRef = doc(db, "users", uid);
    
    // Sanitasi fields sebelum update
    const sanitizedFields = sanitizeData(fields);

    await updateDoc(userRef, {
      ...sanitizedFields,
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
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AiConfig;
    }
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
      console.warn("[FIREBASE] Config AI error:", error.message);
    }
  }
  return null;
};

export const saveAiConfig = async (config: AiConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const dataToSave = sanitizeData({
      openRouterKey: config.openRouterKey || "",
      modelName: config.modelName || "google/gemini-2.0-flash-exp:free",
      maxTokens: Math.min(Number(config.maxTokens) || 4096, 8192),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving AI config:", error);
    throw error;
  }
};

export const getLegalConfig = async (): Promise<LegalConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "legal_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as LegalConfig;
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.warn("[FIREBASE] Legal config error:", e.message);
    }
  }
  return { privacyPolicy: '', termsOfService: '' };
};

export const saveLegalConfig = async (config: LegalConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "legal_configuration");
    const sanitized = sanitizeData({ ...config, updatedAt: new Date().toISOString() });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error("Error saving legal config:", error);
    throw error;
  }
};

export const getLandingPageConfig = async (): Promise<LandingPageConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as LandingPageConfig;
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.warn("[FIREBASE] Landing config error:", e.message);
    }
  }
  return { videoDemoLinks: {} };
};

export const saveLandingPageConfig = async (config: LandingPageConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    const sanitized = sanitizeData({ ...config, updatedAt: new Date().toISOString() });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error("Error saving landing config:", error);
    throw error;
  }
};

export const getMayarConfig = async (): Promise<MayarConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "mayar_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as MayarConfig;
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.warn("[FIREBASE] Config Mayar error:", e.message);
    }
  }
  return null;
};

export const saveMayarConfig = async (config: MayarConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "mayar_configuration");
    const sanitized = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error("Error saving Mayar config:", error);
    throw error;
  }
};

export const getProductsCatalog = async (): Promise<SubscriptionProduct[] | null> => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list;
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.warn("[FIREBASE] Katalog produk error:", e.message);
    }
  }
  return null;
};

export const saveProductsCatalog = async (products: SubscriptionProduct[]) => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    const sanitized = sanitizeData({ list: products, updatedAt: new Date().toISOString() });
    await setDoc(docRef, sanitized);
  } catch (e) {
    throw e;
  }
};

export const processMayarOrder = async (email: string, mayarProdId: string) => {
  const catalog = await getProductsCatalog();
  const matchedPlan = catalog?.find(p => p.mayarProductId === mayarProdId);
  
  if (!matchedPlan) {
    console.error("Order Gagal: ID Produk Mayar tidak dikenali.");
    return;
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("profile.email", "==", email), limit(1));
  const querySnap = await getDocs(q);

  if (querySnap.empty) {
    console.warn("User belum terdaftar. Menunggu registrasi email tersebut.");
    return;
  }

  const userDoc = querySnap.docs[0];
  const userRef = doc(db, "users", userDoc.id);

  const now = new Date();
  const expiry = new Date();
  expiry.setDate(now.getDate() + matchedPlan.durationDays);

  await updateDoc(userRef, {
    plan: matchedPlan.tier,
    status: AccountStatus.ACTIVE,
    activeFrom: now.toISOString(),
    expiryDate: expiry.toISOString(),
    planPermissions: matchedPlan.allowedModules,
    planLimits: matchedPlan.limits,
    updatedAt: new Date().toISOString()
  });

  console.log(`Berhasil mengaktifkan paket ${matchedPlan.name} (Mayar) untuk user ${email}`);
};
