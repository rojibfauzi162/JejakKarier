import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, query, where, orderBy, deleteDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { FeatureRequest, FeatureVote, FeatureRequestStatus } from '../types';

const REQUESTS_COLLECTION = 'featureRequests';
const VOTES_COLLECTION = 'featureVotes';

export const getFeatureRequests = async (): Promise<FeatureRequest[]> => {
  try {
    const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeatureRequest));
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return [];
  }
};

export const createFeatureRequest = async (title: string, description: string, type: 'feature' | 'bugfix', module: string | undefined, userName: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, message: 'User not authenticated' };

    if (description.length < 20) {
      return { success: false, message: 'Deskripsi request minimal 20 karakter.' };
    }

    // Check if user already created a request today
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, REQUESTS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const hasRequestToday = snapshot.docs.some(doc => {
      const data = doc.data();
      return data.createdAt && data.createdAt.startsWith(today);
    });

    if (hasRequestToday) {
      return { success: false, message: 'Anda hanya dapat membuat 1 request per hari.' };
    }

    // Check for duplicates (exact title match)
    const duplicateQuery = query(collection(db, REQUESTS_COLLECTION), where('title', '==', title));
    const duplicateSnapshot = await getDocs(duplicateQuery);
    if (!duplicateSnapshot.empty) {
      return { success: false, message: 'Request dengan judul ini sudah ada.' };
    }

    const newRequestRef = doc(collection(db, REQUESTS_COLLECTION));
    const newRequest: any = {
      id: newRequestRef.id,
      title,
      description,
      type,
      userId,
      userName,
      createdAt: new Date().toISOString(),
      status: FeatureRequestStatus.PENDING,
      voteCount: 0,
      isHidden: false
    };
    
    if (module) {
      newRequest.module = module;
    }

    await setDoc(newRequestRef, newRequest as FeatureRequest);
    return { success: true, message: 'Request berhasil dibuat.' };
  } catch (error) {
    console.error('Error creating feature request:', error);
    return { success: false, message: 'Terjadi kesalahan saat membuat request.' };
  }
};

export const voteFeatureRequest = async (requestId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, message: 'User not authenticated' };

    const today = new Date().toISOString().split('T')[0];
    const voteId = `${userId}_${today}`;
    const voteRef = doc(db, VOTES_COLLECTION, voteId);

    return await runTransaction(db, async (transaction) => {
      const voteDoc = await transaction.get(voteRef);
      if (voteDoc.exists()) {
        throw new Error('Anda hanya dapat memberikan 1 vote per hari.');
      }

      const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists()) {
        throw new Error('Request tidak ditemukan.');
      }

      const currentVoteCount = requestDoc.data().voteCount || 0;

      transaction.set(voteRef, {
        userId,
        requestId,
        date: today,
        createdAt: serverTimestamp()
      });

      transaction.update(requestRef, {
        voteCount: currentVoteCount + 1
      });

      return { success: true, message: 'Vote berhasil ditambahkan.' };
    });
  } catch (error: any) {
    console.error('Error voting feature request:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan saat melakukan vote.' };
  }
};

export const updateFeatureRequestStatus = async (requestId: string, status: FeatureRequestStatus): Promise<void> => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, { status });
  } catch (error) {
    console.error('Error updating feature request status:', error);
    throw error;
  }
};

export const toggleFeatureRequestVisibility = async (requestId: string, isHidden: boolean): Promise<void> => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, { isHidden });
  } catch (error) {
    console.error('Error toggling feature request visibility:', error);
    throw error;
  }
};

export const deleteFeatureRequest = async (requestId: string): Promise<void> => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting feature request:', error);
    throw error;
  }
};
