
import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan, PaymentStatus, AccountStatus, ManualTransaction, AppData } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle, saveUserData, getUserData, getLandingPageConfig } from '../services/firebase';
import { trackingService } from '../services/trackingService';

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
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showMethods, setShowMethods] = useState(false);
  const [showManualSuccess, setShowManualSuccess] = useState(false);
  const [adminPhone, setAdminPhone] = useState('628123456789');

  const CLOUD_FUNCTIONS_URL = "https://us-central1-jejakkarir-11379.cloudfunctions.net/api";

  useEffect(() => {
    getLandingPageConfig().then(cfg => {
      if (cfg && cfg.adminWhatsApp) setAdminPhone(cfg.adminWhatsApp);
    });
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
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/getMethods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price })
      });

      const res = await response.json();
      
      if (response.ok && (res.responseCode === '00' || res.responseCode === '0')) {
        setPaymentMethods(res.paymentFee || []);
        setShowMethods(true);
      } else {
        setError(res.responseMessage || res.statusMessage || "Gagal mengambil metode pembayaran. Pastikan konfigurasi Duitku sudah benar.");
      }
    } catch (err: any) {
      setError(`Koneksi Gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInquiryTransaction = async (methodCode: string) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      console.log("[CHECKOUT] Creating Inquiry for Plan ID:", plan.id);
      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/createInquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          planId: plan.id,
          paymentMethod: methodCode,
          email: user.email,
          customerName: user.displayName || "Customer"
        })
      });

      const res = await response.json();

      if (response.ok && res.statusCode === '00') {
        window.location.href = res.paymentUrl;
      } else {
        setError(res.statusMessage || "Permintaan ditolak oleh server (Error 500/400). Periksa logs admin.");
      }
    } catch (err: any) {
      setError("Gagal menghubungi server backend: " + err.message);
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
        amount: Math.floor(plan.price),
        date: new Date().toISOString(),
        status: PaymentStatus.PENDING,
        planTier: plan.tier,
        durationDays: plan.durationDays,
        paymentMethod: 'Manual',
        userName: user.displayName || "Customer",
        userEmail: user.email
      };
      const currentTxs = userData?.manualTransactions || [];
      await saveUserData(user.uid, { ...userData, manualTransactions: [...currentTxs, newTx] } as AppData);
      setShowManualSuccess(true);
      const message = encodeURIComponent(`Halo Admin FokusKarir, saya sudah checkout paket *${plan.name}* ID: *${orderId}*.\n\nEmail: *${user?.email}*`);
      setTimeout(() => { window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank'); }, 2000);
    } catch (err: any) {
      setError("Gagal memproses transaksi manual.");
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
              <p className="text-slate-400 font-medium">Gateway pembayaran aman untuk akses instan.</p>
            </div>
            <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div><h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3><p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{plan.durationDays} Hari Akses</p></div>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg">PREMIUM</span>
               </div>
               <div className="flex justify-between items-center"><span className="text-lg font-black uppercase tracking-widest text-indigo-400">Total</span><span className="text-2xl font-black">Rp {plan.price.toLocaleString('id-ID')}</span></div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8 lg:p-14 bg-white flex flex-col justify-center overflow-y-auto no-scrollbar max-h-[90vh]">
          {user ? (
            <div className="text-center space-y-10">
              {error && (
                <div className="p-6 bg-rose-50 text-rose-600 text-xs font-bold rounded-[2rem] border border-rose-100 flex items-start gap-4 text-left animate-in slide-in-from-top-2">
                  <i className="bi bi-exclamation-triangle-fill text-xl"></i>
                  <div className="space-y-1">
                    <p className="uppercase tracking-widest font-black text-[10px]">Kesalahan Transaksi</p>
                    <p className="opacity-80 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
              
              {!showMethods ? (
                <>
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner"><i className="bi bi-shield-lock-fill"></i></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase">Pilih Cara Bayar</h3>
                    <p className="text-slate-400 text-sm">Akun: <span className="text-indigo-600 font-black">{user.email}</span></p>
                  </div>
                  
                  <div className="space-y-4">
                    <button onClick={handleFetchPaymentMethods} disabled={loading} className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                      {loading ? (
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : <><i className="bi bi-credit-card-2-back-fill text-lg"></i> Bayar Otomatis</>}
                    </button>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div></div>
                    <button onClick={handlePayManual} disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl hover:bg-black transition-all">Konfirmasi Manual (WhatsApp)</button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase">Pilih Bank / E-Wallet</h3>
                    <button onClick={() => setShowMethods(false)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Batal</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {paymentMethods.map((m: any) => (
                      <button key={m.paymentMethod} onClick={() => handleInquiryTransaction(m.paymentMethod)} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-400 transition-all group">
                        <div className="flex items-center gap-4">
                          <img src={m.paymentImage} alt={m.paymentName} className="w-12 h-auto object-contain bg-white p-1 rounded-lg" />
                          <span className="text-xs font-black text-slate-700 uppercase">{m.paymentName}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-600">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-2"><h3 className="text-2xl font-black text-slate-900 uppercase">Identitas Akun</h3><p className="text-slate-400 text-sm">Lengkapi data untuk membuat invoice.</p></div>
              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Daftar</button>
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Masuk</button>
              </div>
              {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-2xl border border-rose-100 uppercase">⚠️ {error}</div>}
              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" placeholder="Nama Lengkap" value={name} onChange={e => setName(e.target.value)} required />}
                {!isLogin && <input type="tel" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" placeholder="WhatsApp (08...)" value={phone} onChange={e => setPhone(e.target.value)} required />}
                <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
                <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required type="password" />
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl">{loading ? 'Processing...' : 'Lanjut Pembayaran'}</button>
              </form>
              <button onClick={async () => { setLoading(true); try { await signInWithGoogle(); } catch(e){} finally { setLoading(false); } }} className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" /> Daftar via Google</button>
            </div>
          )}
        </div>
      </div>

      {showManualSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[2000] flex items-center justify-center p-6">
           <div className="bg-white max-w-md w-full rounded-[3.5rem] p-10 text-center border border-slate-100 shadow-2xl animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><i className="bi bi-check-circle-fill text-4xl"></i></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase mb-4">Data Tersimpan</h3>
              <p className="text-slate-500 font-bold text-xs uppercase leading-relaxed mb-10">Admin akan segera menghubungi Anda. Anda akan dialihkan ke WhatsApp...</p>
              <button onClick={() => setShowManualSuccess(false)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] tracking-widest">Tutup</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
