
import React, { useState, useEffect } from 'react';
import { SubscriptionProduct, SubscriptionPlan, MayarConfig } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '@firebase/auth';
import { auth, signInWithGoogle, getMayarConfig } from '../services/firebase';

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
  const [mayarConfig, setMayarConfig] = useState<MayarConfig | null>(null);

  useEffect(() => {
    getMayarConfig().then(setMayarConfig);
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

  const handlePay = () => {
    if (!plan.mayarProductId) {
      alert("ID Produk Mayar belum dikonfigurasi. Hubungi Admin.");
      return;
    }

    let baseUrl = "";
    if (mayarConfig?.subdomain) {
      baseUrl = `https://${mayarConfig.subdomain}.myr.id/plink/${plan.mayarProductId}`;
    } else {
      baseUrl = `https://mayar.link/pl/${plan.mayarProductId}`;
    }

    const payUrl = new URL(baseUrl);
    if (user) {
      payUrl.searchParams.set('email', user.email || '');
      payUrl.searchParams.set('name', user.displayName || '');
    }
    window.open(payUrl.toString(), '_blank');
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
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">Order Summary</h2>
              <p className="text-slate-400 font-medium">Lengkapi langkah terakhir untuk mengakselerasi karir Anda.</p>
            </div>

            <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{plan.durationDays} Hari Akses Penuh</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest">Active Tier: {plan.tier}</span>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium italic">Harga Paket</span>
                    <span className="font-black">Rp {plan.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium italic">Biaya Layanan</span>
                    <span className="font-black text-emerald-400">Rp 0 (Gratis)</span>
                  </div>
                  <div className="h-px bg-white/10"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black uppercase tracking-widest text-indigo-400">Total Bayar</span>
                    <span className="text-2xl font-black">Rp {plan.price.toLocaleString('id-ID')}</span>
                  </div>
               </div>
            </div>

            <div className="mt-10 space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manfaat Utama:</p>
               <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                    <i className="bi bi-check-circle-fill text-indigo-500"></i>
                    <span>PENYUSUNAN ROADMAP KARIR AI</span>
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                    <i className="bi bi-check-circle-fill text-indigo-500"></i>
                    <span>LOG AKTIVITAS KERJA TANPA BATAS</span>
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-bold text-slate-300">
                    <i className="bi bi-check-circle-fill text-indigo-500"></i>
                    <span>CV BUILDER PREMIUM v2.0</span>
                  </li>
               </ul>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        </div>

        {/* RIGHT: AUTH & PAYMENT FORM */}
        <div className="p-8 lg:p-14 bg-white flex flex-col justify-center">
          {user ? (
            <div className="text-center space-y-10 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Akun Terverifikasi</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  Anda masuk sebagai <span className="text-indigo-600 font-black">{user.email}</span>. Siap untuk melakukan pembayaran?
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handlePay}
                  className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Lanjut ke Pembayaran 💳
                </button>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Dialihkan ke gateway pembayaran Mayar.id
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Buat Akun Member</h3>
                <p className="text-slate-400 text-sm font-medium">Langkah pertama sebelum aktivasi paket karir Anda.</p>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Daftar Baru</button>
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Sudah Punya Akun</button>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-2xl animate-in slide-in-from-top-2">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all" value={name} onChange={e => setName(e.target.value)} required placeholder="Alex Doe" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all" value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="alex@gmail.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Keamanan</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all" value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder="••••••••" />
                </div>

                <button 
                  disabled={loading}
                  className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isLogin ? 'Masuk & Bayar' : 'Daftar & Bayar'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]"><span className="bg-white px-4 text-slate-400">Atau</span></div>
              </div>

              <button 
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                Lanjut dengan Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
