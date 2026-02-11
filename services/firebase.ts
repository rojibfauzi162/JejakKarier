
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
  } catch (e: any) {
    console.warn("[FIREBASE] Config Mayar error:", e.message);
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

/**
 * Memproses aktivasi paket dari webhook Mayar secara otomatis.
 */
export const processMayarOrder = async (email: string, mayarProdId: string, customerName?: string, customerPhone?: string) => {
  const catalog = await getProductsCatalog();
  const matchedPlan = catalog?.find(p => p.mayarProductId === mayarProdId || p.id === mayarProdId);
  
  if (!matchedPlan) {
    console.error("Aktivasi Gagal: ID Produk/Slug '" + mayarProdId + "' tidak ditemukan di katalog.");
    return;
  }

  const usersRef = collection(db, "users");
  const q = query(usersRef, where("profile.email", "==", email.toLowerCase().trim()), limit(1));
  const querySnap = await getDocs(q);

  const now = new Date();
  let userRef;
  let userData: Partial<AppData> = {};

  if (querySnap.empty) {
    // LOGIKA PEMBUATAN AKUN OTOMATIS JIKA BELUM ADA
    const newUid = `mayar-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    userRef = doc(db, "users", newUid);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + matchedPlan.durationDays);

    userData = {
      uid: newUid,
      role: UserRole.USER, // FIXED: Default role is USER, not Superadmin
      plan: matchedPlan.tier,
      status: AccountStatus.ACTIVE,
      joinedAt: now.toISOString(),
      lastLogin: now.toISOString(),
      activeFrom: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      planPermissions: matchedPlan.allowedModules,
      planLimits: matchedPlan.limits,
      aiUsage: { cvGenerated: 0, coverLetters: 0, careerAnalysis: 0, totalTokens: 0 },
      profile: {
        name: customerName || "Member Mayar",
        email: email.toLowerCase().trim(),
        phone: customerPhone || "",
        birthPlace: "", birthDate: "", maritalStatus: "", domicile: "",
        mainCareer: "", sideCareer: "", currentCompany: "", currentPosition: "",
        jobDesk: "", shortTermTarget: "", longTermTarget: "", description: "",
        photoUrl: "", jobCategory: ""
      },
      workExperiences: [], educations: [], dailyReports: [], dailyReflections: [],
      skills: [], trainings: [], certifications: [], careerPaths: [],
      achievements: [], contacts: [], monthlyReviews: [], jobApplications: [],
      personalProjects: [], todoList: [], todoCategories: ['Pendukung Kerja', 'Pengembangan Diri', 'Buka Peluang', 'Keseimbangan Hidup'],
      careerEvents: [], workCategories: ['Operasional', 'Meeting', 'Learning', 'Administratif', 'Lainnya'],
      onlineCV: { username: "", themeId: "modern-dark", isActive: false, visibleSections: ['work'], selectedItemIds: { work: [], education: [], skills: [], achievements: [], projects: [] }, socialLinks: {} },
      reminderConfig: { weeklyProgress: true, monthlyEvaluation: true, dailyMotivation: true, dailyLogReminderTime: "17:00", reflectionReminderTime: "18:00", todoReminderTime: "20:00", timezone: "Asia/Jakarta" },
      affirmations: ["I am capable of achieving my professional goals"],
      completedAiMilestones: []
    };
    
    await setDoc(userRef, sanitizeData(userData));
  } else {
    // LOGIKA UPDATE AKUN EKSISTING
    const userDoc = querySnap.docs[0];
    const existingData = userDoc.data() as AppData;
    userRef = doc(db, "users", userDoc.id);

    if (existingData.status === AccountStatus.BANNED) {
       console.error("Aktivasi Ditolak: User dalam status Banned.");
       return;
    }

    const currentExpiry = existingData.expiryDate ? new Date(existingData.expiryDate) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + matchedPlan.durationDays);

    await updateDoc(userRef, {
      plan: matchedPlan.tier,
      status: AccountStatus.ACTIVE,
      activeFrom: now.toISOString(),
      expiryDate: newExpiry.toISOString(),
      planPermissions: matchedPlan.allowedModules,
      planLimits: matchedPlan.limits,
      updatedAt: now.toISOString()
      // FIXED: Do not overwrite role. Role remains what it was before.
    });
  }
};
