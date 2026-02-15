
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, increment, query, where, limit, deleteDoc } from "firebase/firestore";
import { AppData, AiConfig, SubscriptionProduct, AccountStatus, LegalConfig, UserRole, LandingPageConfig, MayarConfig, DuitkuConfig, FollowUpConfig, TrackingConfig } from "../types";

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

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Mencari data user berdasarkan email di seluruh koleksi users
 */
export const findUserByEmail = async (email: string): Promise<AppData | null> => {
  if (!email) return null;
  const q = query(collection(db, "users"), where("profile.email", "==", email.toLowerCase().trim()), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { ...querySnapshot.docs[0].data() as AppData, uid: querySnapshot.docs[0].id };
  }
  return null;
};

/**
 * Menghapus dokumen user (digunakan saat konsolidasi duplikat)
 */
export const deleteUserDoc = async (uid: string) => {
  await deleteDoc(doc(db, "users", uid));
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

export const getAllUsers = async (): Promise<AppData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as AppData),
      uid: doc.id
    }));
  } catch (error: any) {
    if (error.code === 'permission-denied') return [];
    throw error;
  }
};

export const updateAdminMetadata = async (uid: string, fields: Partial<AppData>) => {
  try {
    if (!uid) throw new Error("Valid UID required");
    const userRef = doc(db, "users", uid);
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
    if (docSnap.exists()) return docSnap.data() as AiConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config AI error:", error.message);
  }
  return null;
};

export const saveAiConfig = async (config: AiConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "ai_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getDuitkuConfig = async (): Promise<DuitkuConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "duitku_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as DuitkuConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config Duitku error:", error.message);
  }
  return null;
};

export const saveDuitkuConfig = async (config: DuitkuConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "duitku_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getTrackingConfig = async (): Promise<TrackingConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "tracking_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as TrackingConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config Tracking error:", error.message);
  }
  return { metaPixelId: '', googleAnalyticsId: '', tiktokPixelId: '' };
};

export const saveTrackingConfig = async (config: TrackingConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "tracking_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getFollowUpConfig = async (): Promise<FollowUpConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "follow_up_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as FollowUpConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config FollowUp error:", error.message);
  }
  return null;
};

export const saveFollowUpConfig = async (config: FollowUpConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "follow_up_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getLegalConfig = async (): Promise<LegalConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "legal_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as LegalConfig;
  } catch (e: any) {
    console.warn("[FIREBASE] Legal config error:", e.message);
  }
  return { privacyPolicy: '', termsOfService: '' };
};

export const saveLegalConfig = async (config: LegalConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "legal_configuration");
    const sanitized = sanitizeData({ ...config, updatedAt: new Date().toISOString() });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getLandingPageConfig = async (): Promise<LandingPageConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as LandingPageConfig;
  } catch (e: any) {
    console.warn("[FIREBASE] Landing config error:", e.message);
  }
  return { videoDemoLinks: {} };
};

export const saveLandingPageConfig = async (config: LandingPageConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    const sanitized = sanitizeData({ ...config, updatedAt: new Date().toISOString() });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getMayarConfig = async (): Promise<MayarConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "mayar_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as MayarConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config Mayar error:", error.message);
  }
  return null;
};

export const saveMayarConfig = async (config: MayarConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "mayar_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getProductsCatalog = async (): Promise<SubscriptionProduct[] | null> => {
  try {
    const docRef = doc(db, "system_metadata", "products_catalog");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list;
  } catch (e: any) {
    console.warn("[FIREBASE] Katalog produk error:", e.message);
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
