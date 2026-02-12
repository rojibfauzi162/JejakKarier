
import React, { useState } from 'react';
import { SubscriptionProduct, SubscriptionPlan, PaymentStatus, AccountStatus } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle } from '../services/firebase';

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

  const handlePayManual = () => {
    const waNumber = "628123456789"; // Nomor Admin
    const message = encodeURIComponent(`Halo Admin FokusKarir, saya ingin aktivasi paket *${plan.name}* seharga *Rp ${plan.price.toLocaleString('id-ID')}*.\n\nEmail Akun: ${user?.email || '-'}\nNama: ${user?.displayName || '-'}\n\nMohon petunjuk metode pembayarannya.`);
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
              <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase leading-none">Aktivasi Manual</h2>
              <p className="text-slate-400 font-medium">Lengkapi langkah terakhir untuk mendapatkan akses premium.</p>
            </div>

            <div className="mt-12 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{plan.durationDays} Hari Akses Penuh</p>
                  </div>
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
          </div>
        </div>

        {/* RIGHT: AUTH & MANUAL PAYMENT */}
        <div className="p-8 lg:p-14 bg-white flex flex-col justify-center">
          {user ? (
            <div className="text-center space-y-10 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-inner">
                  <i className="bi bi-shield-lock-fill"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Siap Aktivasi</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  Hubungi Admin untuk mendapatkan instruksi pembayaran dan aktivasi akun <span className="text-indigo-600 font-black">{user.email}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handlePayManual}
                  className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Hubungi Admin (Aktivasi) 💬
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Identitas Akun</h3>
                <p className="text-slate-400 text-sm font-medium">Buat akun terlebih dahulu sebelum aktivasi oleh Admin.</p>
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl">
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Daftar Baru</button>
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Masuk</button>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                    <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required type="password" />
                </div>
                <button disabled={loading} className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">{loading ? 'Processing...' : 'Daftar & Hubungi Admin'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
