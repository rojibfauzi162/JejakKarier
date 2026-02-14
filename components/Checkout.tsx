
import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan, PaymentStatus, AccountStatus, ManualTransaction, AppData } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle, saveUserData, getUserData, getDuitkuConfig } from '../services/firebase';

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
  const [duitkuActive, setDuitkuActive] = useState(false);

  useEffect(() => {
    getDuitkuConfig().then(cfg => {
      if (cfg && cfg.merchantCode && cfg.apiKey) {
        setDuitkuActive(true);
      }
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        try {
          await sendEmailVerification(cred.user);
          setSuccessMsg('Pendaftaran Berhasil! Link verifikasi telah dikirim ke email Anda.');
        } catch (e) { console.warn(e); }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTransactionRecord = async (method: 'Manual' | 'Duitku') => {
    if (!user) return null;
    
    setLoading(true);
    try {
      const userData = await getUserData(user.uid);
      if (!userData) throw new Error("User data not found");

      const txId = `TX-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
      const newTx: ManualTransaction = {
        id: txId,
        amount: plan.price,
        date: new Date().toISOString(),
        status: PaymentStatus.PENDING,
        planTier: plan.tier,
        paymentMethod: method,
        notes: `Checkout Paket ${plan.name} via ${method}`,
        userName: user.displayName || userData.profile.name,
        userEmail: user.email || userData.profile.email
      };

      const updatedTransactions = [...(userData.manualTransactions || []), newTx];
      await saveUserData(user.uid, { ...userData, manualTransactions: updatedTransactions });
      return newTx;
    } catch (err: any) {
      setError("Gagal membuat record transaksi: " + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePayDuitku = async () => {
    const tx = await createTransactionRecord('Duitku');
    if (!tx) return;

    // SIMULASI REDIRECT KE DUITKU
    // Pada implementasi produksi, di sini Anda akan memanggil backend Anda 
    // untuk generate paymentUrl Duitku menggunakan API 'requestTransaction'
    alert(`Mengarahkan ke Gateway Pembayaran Duitku...\n\nReference: ${tx.id}\nAmount: Rp ${tx.amount.toLocaleString()}\n\n(Di produksi, ini akan membuka pop-up Duitku)`);
    
    // Simulasi Redirect
    setTimeout(() => {
      window.location.href = "/dashboard"; // Kembali ke dashboard, admin akan melihat status PENDING
    }, 2000);
  };

  const handlePayManual = async () => {
    const tx = await createTransactionRecord('Manual');
    if (!tx) return;

    const waNumber = "628123456789"; // Nomor Admin
    const message = encodeURIComponent(`Halo Admin FokusKarir, saya sudah checkout paket *${plan.name}* dengan Kode Transaksi: *${tx.id}*.\n\nTotal: *Rp ${plan.price.toLocaleString('id-ID')}*\nEmail: ${user?.email}\n\nMohon instruksi pembayarannya.`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-500">
        
        {/* LEFT: ORDER SUMMARY */}
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
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{plan.durationDays} Hari Akses Penuh</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg">PREMIUM</span>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium italic">Harga Paket</span>
                    <span className="font-black">Rp {plan.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black uppercase tracking-widest text-indigo-400">Total Tagihan</span>
                    <span className="text-2xl font-black">Rp {plan.price.toLocaleString('id-ID')}</span>
                  </div>
               </div>
            </div>
            
            <div className="mt-10 p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-relaxed">
                 * Akun Anda akan aktif secara otomatis setelah pembayaran terverifikasi oleh sistem.
               </p>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>

        {/* RIGHT: AUTH & PAYMENT SELECTION */}
        <div className="p-8 lg:p-14 bg-white flex flex-col justify-center">
          {user ? (
            <div className="text-center space-y-10 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pilih Metode Bayar</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  Akun: <span className="text-indigo-600 font-black">{user.email}</span>
                </p>
              </div>

              <div className="space-y-4">
                {duitkuActive ? (
                  <button 
                    onClick={handlePayDuitku}
                    disabled={loading}
                    className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <i className="bi bi-credit-card-2-back-fill text-lg"></i>
                        Bayar Otomatis (Duitku)
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-400 uppercase">
                    Pembayaran Otomatis Sedang Maintenance
                  </div>
                )}
                
                <div className="relative">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                   <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div>
                </div>

                <button 
                  onClick={handlePayManual}
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  Konfirmasi Manual (WhatsApp)
                </button>
              </div>
              
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secure 256-bit SSL Encrypted Payment</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Identitas Akun</h3>
                <p className="text-slate-400 text-sm font-medium">Buat akun terlebih dahulu sebelum melanjutkan pembayaran.</p>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Daftar Baru</button>
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Masuk</button>
              </div>

              {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-2xl border border-rose-100 uppercase">{error}</div>}
              {successMsg && <div className="p-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-2xl border border-emerald-100 uppercase">{successMsg}</div>}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required type="password" />
                </div>
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">{loading ? 'Processing...' : 'Daftar & Lanjut Bayar'}</button>
              </form>
              
              <div className="relative">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                 <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Atau</span></div>
              </div>
              
              <button onClick={handleGoogleLogin} className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                Daftar via Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
