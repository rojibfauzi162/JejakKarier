
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, increment, query, where, limit, deleteDoc, onSnapshot, getDocFromServer } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { AppData, AiConfig, SubscriptionProduct, AccountStatus, LegalConfig, UserRole, LandingPageConfig, MayarConfig, DuitkuConfig, FollowUpConfig, TrackingConfig, EmailSettings, EmailCampaign, EmailLog, SystemTraining, SalesNotification, SalesPopupConfig } from "../types";

// KONFIGURASI FIREBASE
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(console.error);

// Test Connection
async function testConnection() {
  try {
    const docRef = doc(db, 'system_metadata', 'tracking_configuration');
    await getDocFromServer(docRef);
    console.log("[FIREBASE] Connection test successful: tracking_configuration is reachable");
  } catch (error: any) {
    if(error.message?.includes('the client is offline')) {
      console.error("[FIREBASE] Connection test error: The client is offline. Please check your network and Firebase configuration.");
    } else if (error.code === 'permission-denied') {
      console.warn("[FIREBASE] Connection test error: Permission denied for tracking_configuration. Check firestore.rules.");
    } else {
      console.warn("[FIREBASE] Connection test error:", error.message || error);
    }
  }
}
// testConnection();

export const requestNotificationPermission = async (uid: string) => {
  try {
    if (!messaging) {
      console.warn("Messaging is not supported or not initialized.");
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'BK-GXid6LhwxK6G0WAL9tSkYqQygf5XumWf_8CUHvZKNHivQ5_Nz-xUIaQ7t7xQD5OYM18W2_p0f8Axt2zf8_Zk' }); // You need to generate this key in Firebase Console
      if (token) {
        await updateDoc(doc(db, "users", uid), { fcmToken: token });
        return token;
      }
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
  return null;
};

export const uploadImage = async (file: File | Blob, path: string, onProgress?: (progress: number) => void): Promise<string> => {
  const storageRef = ref(storage, path);
  
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Timeout after 15 seconds if no completion (reduced for better UX)
      let isTimedOut = false;
      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        uploadTask.cancel();
        reject(new Error("Upload timed out (15s). Switching to simple upload..."));
      }, 15000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }, 
        (error) => {
          clearTimeout(timeoutId);
          // Ignore cancellation error if it was caused by our timeout
          if (error.code === 'storage/canceled' && isTimedOut) {
            return;
          }
          
          if (error.code !== 'storage/canceled') {
            console.error("Upload error:", error);
          }
          
          if (!isTimedOut) {
            reject(error);
          }
        }, 
        async () => {
          clearTimeout(timeoutId);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } else {
    try {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }
};

export const uploadImageSimple = async (file: File | Blob, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Simple upload error:", error);
    throw error;
  }
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(sanitizeData(errInfo)));
  throw new Error(JSON.stringify(sanitizeData(errInfo)));
}

export const sanitizeData = (obj: any, visited = new WeakSet()): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Detect circular references
  if (visited.has(obj)) {
    return '[Circular]';
  }
  
  // Handle DOM nodes (more robust check)
  if (typeof window !== 'undefined' && (obj instanceof Node || (obj.nodeType && typeof obj.nodeName === 'string'))) {
    return `[DOM Node: ${obj.nodeName || 'Unknown'}]`;
  }

  // Handle Error objects explicitly
  if (obj instanceof Error) {
    const errorObj: any = {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
    // Copy other properties and sanitize them
    Object.keys(obj).forEach(key => {
      try {
        const value = (obj as any)[key];
        if (value !== undefined) {
          errorObj[key] = sanitizeData(value, visited);
        }
      } catch (e) {
        errorObj[key] = '[Unreadable Property]';
      }
    });
    return errorObj;
  }

  // Handle Blobs/Files
  if (typeof window !== 'undefined' && (obj instanceof Blob || obj instanceof File)) {
    return `[${obj.constructor.name}: ${obj.size} bytes, type=${obj.type}]`;
  }

  visited.add(obj);

  // Handle Arrays
  if (Array.isArray(obj)) {
    visited.add(obj);
    return obj.map(item => sanitizeData(item, visited));
  }

  // Handle React Synthetic Events (basic check)
  if (obj._reactName && obj.nativeEvent) {
    return '[React Event]';
  }

  const sanitized: any = {};
  visited.add(obj);
  
  // Use Object.getOwnPropertyNames to get non-enumerable properties if it's a special object
  // but for plain objects Object.keys is enough and safer
  const keys = Object.keys(obj);
  
  keys.forEach(key => {
    try {
      const value = obj[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value, visited);
      }
    } catch (e) {
      sanitized[key] = '[Unreadable Property]';
    }
  });
  
  return sanitized;
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
export const findUserByEmail = async (email: string, excludeUid?: string): Promise<AppData | null> => {
  try {
    if (!email) return null;
    const emailLower = email.toLowerCase().trim();
    const emailOriginal = email.trim();
    
    const q1 = query(collection(db, "users"), where("profile.email", "==", emailLower));
    const q2 = query(collection(db, "users"), where("profile.email", "==", emailOriginal));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const allDocs = [...snap1.docs, ...snap2.docs];
    const uniqueDocs = Array.from(new Set(allDocs.map(d => d.id))).map(id => allDocs.find(d => d.id === id)!);
    
    if (uniqueDocs.length > 0) {
      let docs = uniqueDocs.map(d => ({ ...d.data() as AppData, uid: d.id }));
      if (excludeUid) {
        docs = docs.filter(d => d.uid !== excludeUid);
      }
      
      if (docs.length === 0) return null;

      docs.sort((a, b) => {
        const aScore = (a.dailyReports?.length || 0) + (a.skills?.length || 0) + (a.workExperiences?.length || 0);
        const bScore = (b.dailyReports?.length || 0) + (b.skills?.length || 0) + (b.workExperiences?.length || 0);
        return bScore - aScore;
      });
      return docs[0];
    }
    return null;
  } catch (error: any) {
    console.warn("findUserByEmail error (likely permission denied):", error);
    return null;
  }
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
    if (!auth.currentUser) return []; // Return empty if not authenticated (e.g. demo mode)
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs
      .map(doc => ({
        ...(doc.data() as AppData),
        uid: doc.id
      }));
  } catch (error: any) {
    if (error.code === 'permission-denied') return [];
    handleFirestoreError(error, OperationType.GET, "users");
    return [];
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
    
    // Tambahkan timeout untuk fetch config (10 detik)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout fetching config")), 10000)
    );
    
    const docSnapPromise = getDoc(docRef);
    const docSnap = await Promise.race([docSnapPromise, timeoutPromise]) as any;
    
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
  return { metaPixelId: '', metaConversionAccessToken: '', metaTestCode: '', googleAnalyticsId: '', tiktokPixelId: '' };
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

export const subscribeTrackingConfig = (callback: (config: TrackingConfig) => void) => {
  const path = "system_metadata/tracking_configuration";
  const docRef = doc(db, "system_metadata", "tracking_configuration");
  console.log("[FIREBASE] Starting onSnapshot for:", path);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      console.log("[FIREBASE] Tracking config document found:", docSnap.id);
      callback(docSnap.data() as TrackingConfig);
    } else {
      console.warn("[FIREBASE] Tracking config document NOT FOUND in Firestore");
      callback({ metaPixelId: '', metaConversionAccessToken: '', metaTestCode: '', googleAnalyticsId: '', tiktokPixelId: '' });
    }
  }, (error) => {
    console.warn("[FIREBASE] onSnapshot error for tracking_configuration:", error.message);
    // Don't throw for public config to prevent app crash
    callback({ metaPixelId: '', metaConversionAccessToken: '', metaTestCode: '', googleAnalyticsId: '', tiktokPixelId: '' });
  });
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
    console.log("[FIREBASE] Fetching landing page configuration...");
    const docRef = doc(db, "system_metadata", "landing_page_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("[FIREBASE] Landing page config fetched successfully");
      return docSnap.data() as LandingPageConfig;
    }
    console.warn("[FIREBASE] Landing page config document does not exist");
  } catch (e: any) {
    console.warn("[FIREBASE] Landing config error (non-fatal):", e.message);
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

export const subscribeLandingPageConfig = (callback: (config: LandingPageConfig) => void) => {
  const path = "system_metadata/landing_page_configuration";
  const docRef = doc(db, "system_metadata", "landing_page_configuration");
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as LandingPageConfig);
    }
  }, (error) => {
    console.warn("[FIREBASE] subscribeLandingPageConfig error (non-fatal):", error.message);
    // Don't throw for public config to prevent app crash
  });
};

export const getMayarConfig = async (): Promise<MayarConfig | null> => {
  try {
    console.log("[FIREBASE] Fetching Mayar configuration...");
    const docRef = doc(db, "system_metadata", "mayar_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("[FIREBASE] Mayar config fetched successfully");
      return docSnap.data() as MayarConfig;
    }
    console.warn("[FIREBASE] Mayar config document does not exist");
  } catch (error: any) {
    console.warn("[FIREBASE] Config Mayar error (non-fatal):", error.message);
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

export const getEmailConfig = async (): Promise<EmailSettings | null> => {
  try {
    const docRef = doc(db, "system_metadata", "email_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as EmailSettings;
  } catch (error: any) {
    console.warn("[FIREBASE] Config Email error:", error.message);
  }
  return null;
};

export const saveEmailConfig = async (config: EmailSettings) => {
  try {
    const docRef = doc(db, "system_metadata", "email_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getEmailCampaigns = async (): Promise<EmailCampaign[]> => {
  try {
    const docRef = doc(db, "system_metadata", "email_campaigns_list");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list || [];
    return [];
  } catch (error) {
    console.error("Error getting email campaigns:", error);
    return [];
  }
};

export const saveEmailCampaign = async (campaign: EmailCampaign) => {
  try {
    const docRef = doc(db, "system_metadata", "email_campaigns_list");
    const snap = await getDoc(docRef);
    let list: EmailCampaign[] = [];
    if (snap.exists()) {
      list = snap.data().list || [];
    }
    
    const index = list.findIndex((c: EmailCampaign) => c.id === campaign.id);
    if (index >= 0) {
      list[index] = campaign;
    } else {
      list.push(campaign);
    }
    
    await setDoc(docRef, { list: sanitizeData(list), updatedAt: new Date().toISOString() });
  } catch (error) {
    throw error;
  }
};

export const getEmailLogs = async (): Promise<EmailLog[]> => {
  try {
    const docRef = doc(db, "system_metadata", "email_logs_list");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list || [];
    return [];
  } catch (error) {
    console.error("Error getting email logs:", error);
    return [];
  }
};

export const saveEmailLog = async (log: EmailLog) => {
  try {
    const docRef = doc(db, "system_metadata", "email_logs_list");
    const snap = await getDoc(docRef);
    let list: EmailLog[] = [];
    if (snap.exists()) {
      list = snap.data().list || [];
    }
    list.push(log);
    
    // Limit logs to last 1000 to prevent explosion
    if (list.length > 1000) list = list.slice(-1000);
    
    await setDoc(docRef, { list: sanitizeData(list), updatedAt: new Date().toISOString() });
  } catch (error) {
    throw error;
  }
};

export const getSystemTrainings = async (): Promise<SystemTraining[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "trainings"));
    return querySnapshot.docs.map(doc => ({
      ...(doc.data() as SystemTraining),
      id: doc.id
    }));
  } catch (error) {
    console.error("Error getting trainings:", error);
    return [];
  }
};

export const getSystemTrainingById = async (id: string): Promise<SystemTraining | null> => {
  try {
    const docRef = doc(db, "trainings", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as SystemTraining), id: snap.id } as SystemTraining;
    }
    return null;
  } catch (error) {
    console.error("Error getting training by id:", error);
    return null;
  }
};

export const saveSystemTraining = async (training: SystemTraining) => {
  try {
    const sanitized = sanitizeData(training);
    await setDoc(doc(db, "trainings", training.id), sanitized, { merge: true });
  } catch (error) {
    console.error("Error saving training:", error);
    throw error;
  }
};

export const deleteSystemTraining = async (id: string) => {
  try {
    await deleteDoc(doc(db, "trainings", id));
  } catch (error) {
    console.error("Error deleting training:", error);
    throw error;
  }
};

export const getSalesNotifications = async (): Promise<SalesNotification[]> => {
  const path = "system_metadata/sales_notifications_list";
  try {
    const docRef = doc(db, "system_metadata", "sales_notifications_list");
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().list || [];
    return [];
  } catch (error: any) {
    console.warn("[FIREBASE] Sales notifications error (non-fatal):", error.message);
    return [];
  }
};

export const saveSalesNotification = async (notification: SalesNotification) => {
  try {
    const docRef = doc(db, "system_metadata", "sales_notifications_list");
    const snap = await getDoc(docRef);
    let list: SalesNotification[] = [];
    if (snap.exists()) {
      list = snap.data().list || [];
    }
    
    const id = notification.id;
    if (!id) {
      // If no ID, it's definitely a new one
      list.push({
        ...notification,
        id: `notif_${Date.now()}`,
        createdAt: notification.createdAt || new Date().toISOString()
      });
    } else {
      const index = list.findIndex((n: SalesNotification) => n.id === id);
      if (index >= 0) {
        list[index] = notification;
      } else {
        list.push(notification);
      }
    }
    
    await setDoc(docRef, { list: sanitizeData(list), updatedAt: new Date().toISOString() });
  } catch (error) {
    throw error;
  }
};

export const deleteSalesNotification = async (id: string) => {
  try {
    const docRef = doc(db, "system_metadata", "sales_notifications_list");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      let list: SalesNotification[] = snap.data().list || [];
      list = list.filter(n => n.id !== id);
      await setDoc(docRef, { list: sanitizeData(list), updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    throw error;
  }
};

export const getSalesPopupConfig = async (): Promise<SalesPopupConfig | null> => {
  try {
    const docRef = doc(db, "system_metadata", "sales_popup_configuration");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data() as SalesPopupConfig;
  } catch (error: any) {
    console.warn("[FIREBASE] Config Sales Popup error:", error.message);
  }
  return {
    mode: 'manual',
    intervalMin: 8,
    intervalMax: 15,
    displayDuration: 5,
    isEnabled: true,
    maskName: true,
    manualRatio: 60,
    updatedAt: new Date().toISOString()
  };
};

export const saveSalesPopupConfig = async (config: SalesPopupConfig) => {
  try {
    const docRef = doc(db, "system_metadata", "sales_popup_configuration");
    const dataToSave = sanitizeData({
      ...config,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    throw error;
  }
};

export const getRealSalesData = async (): Promise<any[]> => {
  try {
    const users = await getAllUsers();
    const realSales: any[] = [];
    
    users.forEach(user => {
      if (user.manualTransactions && user.manualTransactions.length > 0) {
        user.manualTransactions.forEach(tx => {
          if (tx.status === 'Paid') {
            realSales.push({
              id: tx.id,
              nama: user.profile?.name || "User",
              aksi: 'baru saja membeli',
              paket: tx.planTier,
              createdAt: tx.date
            });
          }
        });
      }
    });
    
    return realSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "users_aggregation");
    return [];
  }
};
