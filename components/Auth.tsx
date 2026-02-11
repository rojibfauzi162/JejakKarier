
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@firebase/auth';
import { auth, signInWithGoogle } from '../services/firebase';

interface AuthProps {
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // FITUR BARU: Kirim Verifikasi Email
        try {
          await sendEmailVerification(userCredential.user);
          setSuccessMsg('Akun berhasil dibuat! Silakan cek email Anda (termasuk folder spam) untuk memverifikasi akun sebelum melanjutkan.');
        } catch (mailErr: any) {
          console.warn("Gagal mengirim email verifikasi:", mailErr.message);
          // Tetap biarkan login, tapi beri info di dashboard nanti
        }
      }
    } catch (err: any) {
      let friendlyMessage = 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.';
      switch (err.code) {
        case 'auth/invalid-email': friendlyMessage = 'Format alamat email tidak benar.'; break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': friendlyMessage = 'Email atau Password salah.'; break;
        case 'auth/email-already-in-use': friendlyMessage = 'Email ini sudah terdaftar.'; break;
        case 'auth/weak-password': friendlyMessage = 'Password terlalu lemah (min. 6 karakter).'; break;
        default: friendlyMessage = err.message || 'Maaf, terjadi kendala.';
      }
      setError(friendlyMessage);
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
      setError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in duration-500">
        
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors text-[10px] font-black uppercase tracking-widest group"
          >
            <i className="bi bi-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            Kembali
          </button>
        )}

        <div className="text-center mb-10 mt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-black rounded-2xl shadow-xl shadow-blue-500/20 mb-6">F</div>
          <h1 className="text-3xl font-black text-white tracking-tight">FokusKarir</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Your Intelligence Career Partner</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
          <button onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Login</button>
          <button onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Register</button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-xs font-bold mb-6 animate-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-xs font-bold mb-6 animate-in slide-in-from-top-2">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input type="text" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input type="email" required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600" placeholder="alex@fokuskarir.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-600 pr-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
              </button>
            </div>
          </div>

          <button disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4">
            {loading ? 'Processing...' : isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}
          </button>
        </form>

        <div className="relative my-8">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
           <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]"><span className="bg-[#0f172a] px-4 text-slate-500">Atau gunakan</span></div>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading} className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          Masuk dengan Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
