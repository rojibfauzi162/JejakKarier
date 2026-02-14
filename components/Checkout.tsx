import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan, PaymentStatus, AccountStatus, ManualTransaction, AppData } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle, saveUserData, getUserData, getDuitkuConfig } from '../services/firebase';

// --- HELPER HASHING ---
const md5 = (string: string) => {
  function k(a: any, b: any) {
    a[b >> 5] |= 128 << (b % 32);
    a[(((b + 64) >>> 9) << 4) + 14] = b;
    var c = 1732584193, d = -271733879, e = -1732584194, f = 271733878, g = 0;
    for (; g < a.length; g += 16) {
      var h = c, i = d, j = e, l = f;
      c = ff(c, d, e, f, a[g + 0], 7, -680876936);
      f = ff(f, c, d, e, a[g + 1], 12, -389564586);
      e = ff(e, f, c, d, a[g + 2], 17, 606105819);
      d = ff(d, e, f, c, a[g + 3], 22, -1044525330);
      c = ff(c, d, e, f, a[g + 4], 7, -176418897);
      f = ff(f, c, d, e, a[g + 5], 12, 1200080426);
      e = ff(e, f, c, d, a[g + 6], 17, -1473231341);
      d = ff(d, e, f, c, a[g + 7], 22, -45705983);
      c = ff(c, d, e, f, a[g + 8], 7, 1770035416);
      f = ff(f, c, d, e, a[g + 9], 12, -1958414417);
      e = ff(e, f, c, d, a[g + 10], 17, -42063);
      d = ff(d, e, f, c, a[g + 11], 22, -1990404162);
      c = ff(c, d, e, f, a[g + 12], 7, 1804603682);
      f = ff(f, c, d, e, a[g + 13], 12, -40341101);
      e = ff(e, f, c, d, a[g + 14], 17, -1502002290);
      d = ff(d, e, f, c, a[g + 15], 22, 1236535329);
      c = gg(c, d, e, f, a[g + 1], 5, -165796510);
      f = gg(f, c, d, e, a[g + 6], 9, -1069501632);
      e = gg(e, f, c, d, a[g + 11], 14, 643717713);
      d = gg(d, e, f, c, a[g + 0], 20, -373897302);
      c = gg(c, d, e, f, a[g + 5], 5, -701558691);
      f = gg(f, c, d, e, a[g + 10], 9, 38016083);
      e = gg(e, f, c, d, a[g + 15], 14, -660478335);
      d = gg(d, e, f, c, a[g + 4], 20, -405537848);
      c = gg(c, d, e, f, a[g + 9], 5, 568446438);
      f = gg(f, c, d, e, a[g + 14], 9, -1019803690);
      e = gg(e, f, c, d, a[g + 3], 14, -187363961);
      d = gg(d, e, f, c, a[g + 8], 20, 1163531501);
      c = gg(c, d, e, f, a[g + 13], 5, -1444681467);
      f = gg(f, c, d, e, a[g + 2], 9, -51403784);
      e = gg(e, f, c, d, a[g + 7], 14, 1735328473);
      d = gg(d, e, f, c, a[g + 12], 20, -1926607734);
      c = hh(c, d, e, f, a[g + 5], 4, -378558);
      f = hh(f, c, d, e, a[g + 8], 11, -2022574463);
      e = hh(e, f, c, d, a[g + 11], 16, 1839030562);
      d = hh(d, e, f, c, a[g + 14], 23, -35309556);
      c = hh(c, d, e, f, a[g + 1], 4, -1530992060);
      f = hh(f, c, d, e, a[g + 4], 11, 1272893353);
      e = hh(e, f, c, d, a[g + 7], 16, -155497632);
      d = hh(d, e, f, c, a[g + 10], 23, -1094730640);
      c = hh(c, d, e, f, a[g + 13], 4, 681279174);
      f = hh(f, c, d, e, a[g + 0], 11, -358537222);
      e = hh(e, f, c, d, a[g + 3], 16, -722521979);
      d = hh(d, e, f, c, a[g + 6], 23, 76029189);
      c = hh(c, d, e, f, a[g + 9], 4, -640364487);
      f = hh(f, c, d, e, a[g + 12], 11, -421815835);
      e = hh(e, f, c, d, a[g + 15], 16, 530742520);
      d = hh(d, e, f, c, a[g + 2], 23, -995338651);
      c = ii(c, d, e, f, a[g + 0], 6, -198630844);
      f = ii(f, c, d, e, a[g + 7], 10, 1126891415);
      e = ii(e, f, c, d, a[g + 14], 15, -1416354905);
      d = ii(d, e, f, c, a[g + 5], 21, -57434055);
      c = ii(c, d, e, f, a[g + 12], 6, 1700485571);
      f = ii(f, c, d, e, a[g + 3], 10, -1894946606);
      e = ii(e, f, c, d, a[g + 10], 15, -1051523);
      d = ii(d, e, f, c, a[g + 1], 21, -2054922799);
      c = ii(c, d, e, f, a[g + 8], 6, 1873313359);
      f = ii(f, c, d, e, a[g + 15], 10, -30611744);
      e = ii(e, f, c, d, a[g + 6], 15, -1560198380);
      d = ii(d, e, f, c, a[g + 13], 21, 1309151649);
      c = ii(c, d, e, f, a[g + 4], 6, -145523070);
      f = ii(f, c, d, e, a[g + 11], 10, -1120210379);
      e = ii(e, f, c, d, a[g + 2], 15, 718787280);
      d = ii(d, e, f, c, a[g + 9], 21, -343485551);
      c = add32(c, h);
      d = add32(d, i);
      e = add32(e, j);
      f = add32(f, l);
    }
    return [c, d, e, f];
  }
  function ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
  function cmn(q: any, a: any, b: any, x: any, s: any, t: any) { return add32(rot(add32(add32(a, q), add32(x, t)), s), b); }
  function add32(a: any, b: any) { return (a + b) & 4294967295; }
  function rot(a: any, b: any) { return (a << b) | (a >>> (32 - b)); }
  function strToWords(s: string) {
    var a: any[] = [], i = 0;
    for (; i < s.length * 8; i += 8) a[i >> 5] |= (s.charCodeAt(i / 8) & 255) << (i % 32);
    return a;
  }
  function wordsToHex(a: any) {
    var s = "", i = 0;
    for (; i < a.length * 32; i += 8) s += ((a[i >> 5] >>> (i % 32)) & 255).toString(16).padStart(2, '0');
    return s;
  }
  return wordsToHex(k(strToWords(string), string.length * 8));
};

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
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [duitkuConfig, setDuitkuConfig] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showMethods, setShowMethods] = useState(false);

  useEffect(() => {
    getDuitkuConfig().then(cfg => {
      if (cfg && cfg.merchantCode && cfg.apiKey) {
        setDuitkuConfig(cfg);
      }
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        try { await sendEmailVerification(cred.user); } catch (e) {}
        setSuccessMsg('Daftar Berhasil! Silakan cek email verifikasi.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPaymentMethods = async () => {
    if (!duitkuConfig) return;
    setLoading(true);
    try {
      const datetime = new Date().toISOString().replace('T', ' ').split('.')[0];
      const signature = await sha256(duitkuConfig.merchantCode + plan.price + datetime + duitkuConfig.apiKey);
      
      const url = duitkuConfig.environment === 'sandbox' 
        ? 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
        : 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantcode: duitkuConfig.merchantCode,
          amount: plan.price,
          datetime: datetime,
          signature: signature
        })
      });

      const res = await response.json();
      if (res.responseCode === '00') {
        setPaymentMethods(res.paymentFee);
        setShowMethods(true);
      } else {
        setError(res.responseMessage || "Gagal mengambil metode pembayaran");
      }
    } catch (err: any) {
      setError("CORS Error: Akses Duitku diblokir oleh browser. Gunakan server-side proxy atau pastikan setting Merchant Duitku benar.");
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryTransaction = async (methodCode: string) => {
    if (!duitkuConfig || !user) return;
    setLoading(true);
    try {
      const orderId = `FC-${Date.now()}`;
      const signature = md5(duitkuConfig.merchantCode + orderId + plan.price + duitkuConfig.apiKey);
      
      const userData = await getUserData(user.uid);
      const customerName = user.displayName || userData?.profile?.name || "Customer";
      
      const payload = {
        merchantCode: duitkuConfig.merchantCode,
        paymentAmount: plan.price,
        paymentMethod: methodCode,
        merchantOrderId: orderId,
        productDetails: `Langganan ${plan.name}`,
        email: user.email,
        customerVaName: customerName,
        callbackUrl: duitkuConfig.callbackUrl || `${window.location.origin}/api/callback`,
        returnUrl: duitkuConfig.returnUrl || window.location.origin,
        expiryPeriod: 60,
        signature: signature
      };

      const url = duitkuConfig.environment === 'sandbox'
        ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
        : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (res.statusCode === '00') {
        // Simpan transaksi PENDING ke Firestore
        const newTx: ManualTransaction = {
          id: orderId,
          amount: plan.price,
          date: new Date().toISOString(),
          status: PaymentStatus.PENDING,
          planTier: plan.tier,
          paymentMethod: 'Duitku',
          reference: res.reference,
          userName: customerName,
          userEmail: user.email
        };
        const updatedTransactions = [...(userData?.manualTransactions || []), newTx];
        await saveUserData(user.uid, { ...userData, manualTransactions: updatedTransactions } as AppData);
        
        // REDIRECT KE PAYMENT URL ASLI
        window.location.href = res.paymentUrl;
      } else {
        setError(res.statusMessage || "Inquiry Gagal");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan sistem saat menghubungi Duitku.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayManual = async () => {
    setLoading(true);
    try {
      const orderId = `TX-MANUAL-${Date.now()}`;
      const userData = await getUserData(user.uid);
      const newTx: ManualTransaction = {
        id: orderId,
        amount: plan.price,
        date: new Date().toISOString(),
        status: PaymentStatus.PENDING,
        planTier: plan.tier,
        paymentMethod: 'Manual',
        userName: user.displayName || userData?.profile?.name,
        userEmail: user.email
      };
      await saveUserData(user.uid, { ...userData, manualTransactions: [...(userData?.manualTransactions || []), newTx] } as AppData);
      
      const waNumber = "628123456789"; 
      const message = encodeURIComponent(`Halo Admin FokusKarir, saya sudah checkout paket *${plan.name}* dengan ID: *${orderId}*.\nEmail: ${user?.email}\nMohon instruksi pembayaran.`);
      window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans">
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
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-relaxed">* Akun Anda akan aktif otomatis setelah pembayaran terverifikasi.</p>
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
                  {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-2xl border border-rose-100 uppercase">{error}</div>}
                  <div className="space-y-4">
                    {duitkuConfig ? (
                      <button onClick={handleFetchPaymentMethods} disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                        {loading ? 'Processing...' : <><i className="bi bi-credit-card-2-back-fill text-lg"></i> Bayar Otomatis (Duitku)</>}
                      </button>
                    ) : <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 uppercase">Gateway Sedang Maintenance</div>}
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
                    {paymentMethods.map((m: any) => (
                      <button 
                        key={m.paymentMethod}
                        onClick={() => handleInquiryTransaction(m.paymentMethod)}
                        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-white transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <img src={m.paymentImage} alt={m.paymentName} className="w-12 h-auto object-contain bg-white p-1 rounded-lg" />
                          <span className="text-xs font-black text-slate-700 uppercase">{m.paymentName}</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    ))}
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
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label><input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required type="email" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label><input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required type="password" /></div>
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl">{loading ? 'Processing...' : 'Lanjut Bayar'}</button>
              </form>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div></div>
              <button onClick={async () => { setLoading(true); try { await signInWithGoogle(); } catch(e){} finally { setLoading(false); } }} className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" /> Daftar via Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;