
import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan, PaymentStatus, AccountStatus, ManualTransaction, AppData } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle, saveUserData, getUserData, getDuitkuConfig, getLandingPageConfig } from '../services/firebase';
import { trackingService } from '../services/trackingService';

// --- FULL SELF-CONTAINED HASHING HELPERS ---

// MD5 Implementation (untuk Inquiry/Transaksi)
export const md5 = (string: string) => {
  function add32(a: number, b: number) { return (a + b) & 0xFFFFFFFF; }
  function rot(a: number, b: number) { return (a << b) | (a >>> (32 - b)); }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return add32(rot(add32(add32(a, (b & c) | (~b & d)), add32(x, t)), s), b); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return add32(rot(add32(add32(a, (b & d) | (c & ~d)), add32(x, t)), s), b); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return add32(rot(add32(add32(a, b ^ c ^ d), add32(x, t)), s), b); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return add32(rot(add32(add32(a, c ^ (b | ~d)), add32(x, t)), s), b); }
  
  const words: number[] = [];
  for (let i = 0; i < string.length * 8; i += 8) words[i >> 5] |= (string.charCodeAt(i / 8) & 0xFF) << (i % 32);
  let b = string.length * 8;
  words[b >> 5] |= 0x80 << (b % 32);
  words[(((b + 64) >>> 9) << 4) + 14] = b;
  
  let a = 1732584193, c = -1732584194, d = 271733878, e = -271733879;
  for (let i = 0; i < words.length; i += 16) {
    let oa = a, ob = d, oc = c, od = e;
    a = ff(a, d, c, e, words[i+0], 7, -680876936); e = ff(e, a, d, c, words[i+1], 12, -389564586); c = ff(c, e, a, d, words[i+2], 17, 606105819); d = ff(d, c, e, a, words[i+3], 22, -1044525330);
    a = ff(a, d, c, e, words[i+4], 7, -176418897); e = ff(e, a, d, c, words[i+5], 12, 1200080426); c = ff(c, e, a, d, words[i+6], 17, -1473231341); d = ff(d, c, e, a, words[i+7], 22, -45705983);
    a = ff(a, d, c, e, words[i+8], 7, 1770035416); e = ff(e, a, d, c, words[i+9], 12, -1958414417); c = ff(c, e, a, d, words[i+10], 17, -42063); d = ff(d, c, e, a, words[i+11], 22, -1990404162);
    a = ff(a, d, c, e, words[i+12], 7, 1804603682); e = ff(e, a, d, c, words[i+13], 12, -40341101); c = ff(c, e, a, d, words[i+14], 17, -1502002290); d = ff(d, c, e, a, words[i+15], 22, 1236535329);
    a = gg(a, d, c, e, words[i+1], 5, -165796510); e = gg(e, a, d, c, words[i+6], 9, -1069501632); c = gg(c, e, a, d, words[i+11], 14, 643717713); d = gg(d, c, e, a, words[i+0], 20, -373897302);
    a = gg(a, d, c, e, words[i+5], 5, -701558691); e = gg(e, a, d, c, words[i+10], 9, 38016083); c = gg(c, e, a, d, words[i+15], 14, -660478335); d = gg(d, c, e, a, words[i+4], 20, -405537848);
    a = gg(a, d, c, e, words[i+9], 5, 568446438); e = gg(e, a, d, c, words[i+14], 9, -1019803690); c = gg(c, e, a, d, words[i+3], 14, -187363961); d = gg(d, c, e, a, words[i+8], 20, 1163531501);
    a = gg(a, d, c, e, words[i+13], 5, -1444681467); e = gg(e, a, d, c, words[i+2], 9, -51403784); c = gg(c, e, a, d, words[i+7], 14, 1735328473); d = gg(d, c, e, a, words[i+12], 20, -1926607734);
    a = hh(a, d, c, e, words[i+5], 4, -378558); e = hh(e, a, d, c, words[i+8], 11, -2022574463); c = hh(c, e, a, d, words[i+11], 16, 1839030562); d = hh(d, c, e, a, words[i+14], 23, -35309556);
    a = hh(a, d, c, e, words[i+1], 4, -1530992060); e = hh(e, a, d, c, words[i+4], 11, 1272893353); c = hh(c, e, a, d, words[i+7], 16, -155497632); d = hh(d, c, e, a, words[i+10], 23, -1094730640);
    a = hh(a, d, c, e, words[i+13], 4, 681279174); e = hh(e, a, d, c, words[i+0], 11, -358537222); c = hh(c, e, a, d, words[i+3], 16, -722521979); d = hh(d, c, e, a, words[i+6], 23, 76029189);
    a = hh(a, d, c, e, words[i+9], 4, -640364487); e = hh(e, a, d, c, words[i+12], 11, -421815835); c = hh(c, e, a, d, words[i+15], 16, 530742520); d = hh(d, c, e, a, words[i+2], 23, -995338651);
    a = ii(a, d, c, e, words[i+0], 6, -198630844); e = ii(e, a, d, c, words[i+7], 10, 1126891415); c = ii(c, e, a, d, words[i+14], 15, -1416354905); d = ii(d, c, e, a, words[i+5], 21, -57434055);
    a = ii(a, d, c, e, words[i+12], 6, 1700485571); e = ii(e, a, d, c, words[i+3], 10, -1894946606); c = ii(c, e, a, d, words[i+10], 15, -1051523); d = ii(d, c, e, a, words[i+1], 21, -2054922799);
    a = ii(a, d, c, e, words[i+8], 6, 1873313359); e = ii(e, a, d, c, words[i+15], 10, -30611744); c = ii(c, e, a, d, words[i+6], 15, -1560198380); d = ii(d, c, e, a, words[i+13], 21, 1309151649);
    a = ii(a, d, c, e, words[i+4], 6, -145523070); e = ii(e, a, d, c, words[i+11], 10, -1120210379); c = ii(c, e, a, d, words[i+2], 15, 718787280); d = ii(d, c, e, a, words[i+9], 21, -343485551);
    a = add32(a, oa); d = add32(d, ob); c = add32(c, oc); e = add32(e, od);
  }
  return [a, d, c, e].map(v => ("00000000" + (v >>> 0).toString(16)).slice(-8).split("").reverse().join("").match(/../g)!.join("")).join("");
};

// SHA256 Implementation (untuk Get Payment Method)
const sha256 = async (string: string) => {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface CheckoutProps {
  plan: SubscriptionProduct;
  user?: any;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ plan, user, onBack }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [duitkuConfig, setDuitkuConfig] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showMethods, setShowMethods] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [adminPhone, setAdminPhone] = useState('628123456789');

  // CORS Proxy Bridge
  const CORS_PROXY = "https://api.allorigins.win/raw?url=";

  useEffect(() => {
    getDuitkuConfig().then(cfg => {
      if (cfg && cfg.merchantCode && cfg.apiKey) {
        setDuitkuConfig(cfg);
      }
    });
    getLandingPageConfig().then(cfg => {
      if (cfg && cfg.adminWhatsApp) {
        setAdminPhone(cfg.adminWhatsApp);
      }
    });
    // Tracking InitiateCheckout
    trackingService.trackEvent('InitiateCheckout', { value: plan.price, currency: 'IDR', content_name: plan.name });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        localStorage.setItem('pending_registration', JSON.stringify({ name, email, phone }));
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        try { await sendEmailVerification(cred.user); } catch (e) {}
        setSuccessMsg('Daftar Berhasil! Silakan cek email verifikasi.');
      }
    } catch (err: any) {
      setError(err.message);
      if (!isLogin) localStorage.removeItem('pending_registration');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPaymentMethods = async () => {
    if (!duitkuConfig) return;
    setLoading(true);
    setError('');
    try {
      // 1. Format Datetime Sesuai PHP: date('Y-m-d H:i:s')
      const now = new Date();
      const datetime = now.getFullYear() + "-" + 
                      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                      String(now.getDate()).padStart(2, '0') + " " + 
                      String(now.getHours()).padStart(2, '0') + ":" + 
                      String(now.getMinutes()).padStart(2, '0') + ":" + 
                      String(now.getSeconds()).padStart(2, '0');

      // 2. Signature SHA256 Sesuai PHP
      const signatureStr = duitkuConfig.merchantCode + plan.price.toString() + datetime + duitkuConfig.apiKey;
      const signature = await sha256(signatureStr);
      
      // 3. Request Parameters dengan Key Sesuai PHP (merchantcode, amount, datetime, signature)
      const payload = {
        merchantcode: duitkuConfig.merchantCode,
        amount: plan.price,
        datetime: datetime,
        signature: signature
      };

      const baseUrl = duitkuConfig.environment === 'sandbox' 
        ? 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      const url = CORS_PROXY + encodeURIComponent(baseUrl);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      
      const res = await response.json();
      
      // 4. Handle Response Code
      if (res.responseCode === '00') {
        setPaymentMethods(res.paymentFee || []);
        setShowMethods(true);
      } else {
        setError(res.responseMessage || "Gagal mengambil metode pembayaran dari Duitku.");
      }
    } catch (err: any) {
      console.error("Duitku Fetch Error:", err);
      setError("Kesalahan Koneksi Duitku. Pastikan API Key & Merchant Code di panel Admin sudah benar.");
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryTransaction = async (methodCode: string) => {
    if (!duitkuConfig || !user) return;
    setLoading(true);
    setError('');
    try {
      // Order ID unik berbasis timestamp agar unik di Duitku
      const orderId = "FK-" + Date.now();
      const amount = Math.floor(plan.price);
      
      // Signature MD5 Sesuai PHP: md5($merchantCode . $merchantOrderId . $paymentAmount . $apiKey)
      const signatureStr = duitkuConfig.merchantCode + orderId + amount.toString() + duitkuConfig.apiKey;
      const signature = md5(signatureStr);
      
      const userData = await getUserData(user.uid);
      const customerName = user.displayName || userData?.profile?.name || "Customer";
      
      // Inquiry Params (v2)
      const payload = {
        merchantCode: duitkuConfig.merchantCode,
        paymentAmount: amount,
        paymentMethod: methodCode,
        merchantOrderId: orderId,
        productDetails: `Langganan FokusKarir ${plan.name}`,
        email: user.email,
        customerVaName: customerName,
        callbackUrl: duitkuConfig.callbackUrl || `${window.location.origin}/api/callback`,
        returnUrl: `${window.location.origin}/billing`,
        expiryPeriod: 60,
        additionalParam: user.uid, // SANGAT PENTING: Untuk identifikasi user di callback
        itemDetails: [
          {
            name: plan.name,
            quantity: 1,
            price: amount
          }
        ],
        signature: signature
      };

      const baseUrl = duitkuConfig.environment === 'sandbox'
        ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
        : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

      const url = CORS_PROXY + encodeURIComponent(baseUrl);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const res = await response.json();
      if (res.statusCode === '00') {
        // Catat transaksi PENDING ke database lokal (Firestore)
        const newTx: ManualTransaction = {
          id: orderId,
          amount: amount,
          date: new Date().toISOString(),
          status: PaymentStatus.PENDING,
          planTier: plan.tier,
          durationDays: plan.durationDays,
          paymentMethod: 'Duitku',
          reference: res.reference,
          userName: customerName,
          userEmail: user.email,
          checkoutUrl: res.paymentUrl
        };
        
        const currentTxs = userData?.manualTransactions || [];
        await saveUserData(user.uid, { ...userData, manualTransactions: [...currentTxs, newTx] } as AppData);
        
        // Redirect ke halaman pembayaran Duitku
        window.location.href = res.paymentUrl;
      } else {
        setError(res.statusMessage || "Gagal membuat invoice pembayaran.");
      }
    } catch (err: any) {
      console.error("Inquiry Error:", err);
      setError("Gagal menghubungi gateway pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayManual = async () => {
    setLoading(true);
    try {
      const orderId = `TX-MANUAL-${Date.now()}`;
      const amount = Math.floor(plan.price);
      const userData = await getUserData(user.uid);
      const customerName = user.displayName || userData?.profile?.name || "Customer";
      
      const newTx: ManualTransaction = {
        id: orderId,
        amount: amount,
        date: new Date().toISOString(),
        status: PaymentStatus.PENDING,
        planTier: plan.tier,
        durationDays: plan.durationDays,
        paymentMethod: 'Manual',
        userName: customerName,
        userEmail: user.email
      };
      
      const currentTxs = userData?.manualTransactions || [];
      await saveUserData(user.uid, { ...userData, manualTransactions: [...currentTxs, newTx] } as AppData);
      
      setShowManualSuccess(true);
      
      const message = encodeURIComponent(`Halo Admin FokusKarir, saya sudah checkout paket *${plan.name}* dengan ID: *${orderId}*.\n\nNama: *${customerName}*\nEmail: *${user?.email}*\n\nMohon instruksi pembayaran manual.`);
      
      setTimeout(() => {
        window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');
      }, 2000);
      
    } catch (err: any) {
      setError("Gagal menyimpan data transaksi manual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans text-slate-900">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-500">
        
        <div className="bg-slate-900 p-8 lg:p-14 text-white space-y-12 relative overflow-hidden">
          <div className="relative z-10">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-12">
               <i className="bi bi-arrow-left"></i> Kembali Pilih Paket
            </button>
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">Checkout Pembayaran</h2>
              <p className="text-slate-400 font-medium">Satu langkah lagi menuju karir profesional yang terukur.</p>
            </div>
            <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div><h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{plan.durationDays} Hari Akses Penuh</p></div>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg">PREMIUM</span>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-medium italic">Harga Paket</span><span className="font-black">Rp {plan.price.toLocaleString('id-ID')}</span></div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center"><span className="text-lg font-black uppercase tracking-widest text-indigo-400">Total Tagihan</span><span className="text-2xl font-black">Rp {plan.price.toLocaleString('id-ID')}</span></div>
               </div>
            </div>
            <div className="mt-10 p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-relaxed">* Akun Anda akan aktif otomatis setelah pembayaran terverifikasi oleh sistem.</p>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8 lg:p-14 bg-white flex flex-col justify-center overflow-y-auto no-scrollbar max-h-[90vh]">
          {user ? (
            <div className="text-center space-y-10 animate-in fade-in duration-500">
              {!showMethods ? (
                <>
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner"><i className="bi bi-shield-lock-fill"></i></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pilih Metode Bayar</h3>
                    <p className="text-slate-400 text-sm font-medium">Akun: <span className="text-indigo-600 font-black">{user.email}</span></p>
                  </div>
                  {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-2xl border border-rose-100 uppercase animate-shake">{error}</div>}
                  <div className="space-y-4">
                    <button onClick={handleFetchPaymentMethods} disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                      {loading ? 'Processing...' : <><i className="bi bi-credit-card-2-back-fill text-lg"></i> Bayar Otomatis (Duitku)</>}
                    </button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div></div>
                    <button onClick={handlePayManual} disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">Konfirmasi Manual (WhatsApp)</button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase">Pilih Cara Bayar</h3>
                    <button onClick={() => setShowMethods(false)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Batal</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {paymentMethods.length > 0 ? paymentMethods.map((m: any) => (
                      <button 
                        key={m.paymentMethod}
                        onClick={() => handleInquiryTransaction(m.paymentMethod)}
                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img src={m.paymentImage} alt={m.paymentName} className="w-12 h-auto object-contain bg-white p-1 rounded-lg" />
                          <div className="text-left">
                             <span className="text-xs font-black text-slate-700 uppercase block">{m.paymentName}</span>
                             {m.totalFee > 0 && <span className="text-[8px] font-bold text-slate-400">Fee: Rp {parseInt(m.totalFee).toLocaleString('id-ID')}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    )) : (
                      <div className="py-12 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Gagal memuat opsi, silakan coba metode manual.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secure 256-bit SSL Encrypted Payment</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2"><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Identitas Akun</h3><p className="text-slate-400 text-sm font-medium">Buat akun terlebih dahulu sebelum melanjutkan.</p></div>
              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Daftar</button>
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Masuk</button>
              </div>
              {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-2xl border border-rose-100 uppercase">{error}</div>}
              {successMsg && <div className="p-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-2xl border border-emerald-100 uppercase">{successMsg}</div>}
              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label><input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={name} onChange={e => setName(e.target.value)} required /></div>}
                {!isLogin && <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label><input type="tel" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={phone} onChange={e => setPhone(e.target.value)} required /></div>}
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label><input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required type="email" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label><input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required type="password" /></div>
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl">{loading ? 'Processing...' : 'Lanjut Bayar'}</button>
              </form>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div></div>
              <button onClick={async () => { setLoading(true); try { await signInWithGoogle(); } catch(e){} finally { setLoading(false); } }} className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" /> Daftar via Google
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SUKSES TRANSAKSI MANUAL */}
      {showManualSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 lg:p-12 border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <i className="bi bi-check-circle-fill text-4xl"></i>
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Data Telah Tersimpan</h3>
                 <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed mb-10">
                   Kami akan menghubungkan ke tim admin kami, mohon ditunggu. <br/>
                   <span className="text-indigo-600 block mt-2">Anda akan dialihkan ke WhatsApp...</span>
                 </p>
                 <button 
                  onClick={() => setShowManualSuccess(false)}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-black transition-all"
                 >
                   Tutup Panel
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
