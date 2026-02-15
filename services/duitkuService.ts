
import { md5 } from '../components/Checkout';
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PaymentStatus, AccountStatus, SubscriptionPlan, AppData, ManualTransaction } from '../types';

/**
 * Service untuk menangani logika Bisnis Payment Gateway Duitku
 */
export const duitkuService = {
  /**
   * Verifikasi Signature dari Callback Duitku
   * Formula: md5(merchantCode + amount + merchantOrderId + apiKey)
   */
  verifySignature: (params: {
    merchantCode: string;
    amount: string;
    merchantOrderId: string;
    signature: string;
    apiKey: string;
  }) => {
    const calc = md5(params.merchantCode + params.amount + params.merchantOrderId + params.apiKey);
    return calc === params.signature;
  },

  /**
   * Memproses hasil callback secara idempotent
   */
  processCallback: async (payload: {
    merchantOrderId: string;
    resultCode: string;
    amount: string;
    additionalParam: string; // Berisi UID User
    reference: string;
    apiKey: string;
  }, products: any[]) => {
    const { merchantOrderId, resultCode, amount, additionalParam, reference } = payload;
    
    if (!additionalParam) throw new Error("UID User (additionalParam) tidak ditemukan.");

    const userRef = doc(db, "users", additionalParam);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) throw new Error("User tidak ditemukan di database.");
    
    const userData = userSnap.data() as AppData;
    const transactions = userData.manualTransactions || [];
    
    // 1. Cari transaksi yang sesuai
    const txIndex = transactions.findIndex(t => t.id === merchantOrderId);
    if (txIndex === -1) throw new Error("Data transaksi tidak ditemukan di record user.");

    const currentTx = transactions[txIndex];

    // 2. IDEMPOTENCY CHECK: Jika sudah 'Paid', jangan proses lagi
    if (currentTx.status === PaymentStatus.PAID) {
      console.log("[DUITKU] Transaksi sudah diproses sebelumnya (Idempotent).");
      return { success: true, message: "Already processed" };
    }

    // 3. Update status jika berhasil (resultCode '00' adalah sukses di Duitku)
    if (resultCode === '00') {
      const updatedTxs = [...transactions];
      updatedTxs[txIndex] = {
        ...currentTx,
        status: PaymentStatus.PAID,
        reference: reference,
        amount: parseInt(amount)
      };

      // 4. Kalkulasi Masa Aktif
      const duration = currentTx.durationDays || 30;
      const now = new Date();
      
      // Jika masih ada masa aktif, tambahkan dari expiryDate lama, jika tidak dari sekarang
      let baseDate = new Date();
      if (userData.expiryDate) {
        const oldExpiry = new Date(userData.expiryDate);
        if (oldExpiry > now) baseDate = oldExpiry;
      }

      const newExpiry = new Date(baseDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      
      // 5. Cari spesifikasi limit dari produk
      const product = products.find(p => p.tier === currentTx.planTier);

      // 6. Update Dokumen User
      await updateDoc(userRef, {
        manualTransactions: updatedTxs,
        plan: currentTx.planTier,
        status: AccountStatus.ACTIVE,
        expiryDate: newExpiry.toISOString(),
        planPermissions: product?.allowedModules || userData.planPermissions,
        planLimits: product?.limits || userData.planLimits,
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: "Subscription activated" };
    } else {
      // Jika gagal / expired
      const updatedTxs = [...transactions];
      updatedTxs[txIndex] = { ...currentTx, status: PaymentStatus.EXPIRED };
      await updateDoc(userRef, { manualTransactions: updatedTxs });
      return { success: false, message: "Payment failed or expired" };
    }
  }
};
