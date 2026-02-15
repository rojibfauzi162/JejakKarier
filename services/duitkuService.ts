
import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PaymentStatus, AccountStatus, SubscriptionPlan, AppData, ManualTransaction } from '../types';

/**
 * Service untuk menangani logika Bisnis Payment Gateway Duitku
 */

// Added local MD5 implementation since it was removed from Checkout.tsx for security reasons
// but is still required by verifySignature for signature validation.
function md5(str: string): string {
  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const msg = unescape(encodeURIComponent(str));
  const len = msg.length;
  const words = new Uint32Array(((len + 8) >> 6) + 1 << 4);
  for (let i = 0; i < len; i++) words[i >> 2] |= msg.charCodeAt(i) << ((i % 4) << 3);
  words[len >> 2] |= 0x80 << ((len % 4) << 3);
  words[words.length - 2] = len * 8;
  const r = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];
  for (let i = 0; i < words.length; i += 16) {
    let [aa, bb, cc, dd] = [a, b, c, d];
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      const t = d; d = c; c = b;
      const v = (a + f + k[j] + words[i + g]) | 0;
      b = (b + ((v << r[j]) | (v >>> (32 - r[j])))) | 0;
      a = t;
    }
    a = (a + aa) | 0; b = (b + bb) | 0; c = (c + cc) | 0; d = (d + dd) | 0;
  }
  return [a, b, c, d].map(v => {
    let s = "";
    for (let i = 0; i < 4; i++) s += ((v >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    return s;
  }).join("");
}

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
    // FIX: Using local md5 implementation to calculate signature
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
